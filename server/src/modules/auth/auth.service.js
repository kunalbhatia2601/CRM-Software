import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../utils/prisma.js";
import config from "../../config/index.js";
import { ApiError } from "../../utils/apiError.js";
import { sendMail } from "../../utils/mailer.js";
import emailTemplateService from "../email-template/email-template.service.js";
import cache from "../../utils/cache.js";
import otpService from "./otp.service.js";

class AuthService {
  /**
   * Register a new user
   */
  async register({ email, password, firstName, lastName, phone, role }) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw ApiError.conflict("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.saltRounds);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || "EMPLOYEE",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id);

    return { user, tokens };
  }

  /**
   * Login — Step 1: Validate credentials.
   * If OTP is enabled, sends OTP and returns { otpRequired: true }.
   * If OTP is not enabled, returns tokens directly.
   */
  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw ApiError.forbidden("Account is not active");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Check if OTP login is enabled
    const otpConfig = await otpService.getOtpConfig();

    if (otpConfig.enabled) {
      // Send OTP and return pending state
      const otpResult = await otpService.sendOtp(user.id, user.email, user.firstName);
      return {
        otpRequired: true,
        userId: user.id,
        email: user.email,
        expiryMins: otpResult.expiryMins,
        digits: otpResult.digits,
      };
    }

    // No OTP — issue tokens directly
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Login — Step 2: Verify OTP and issue tokens.
   */
  async verifyLoginOtp(userId, otpCode) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.status !== "ACTIVE") throw ApiError.forbidden("Account is not active");

    // Verify OTP
    await otpService.verifyOtp(userId, otpCode);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id);
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  /**
   * Resend OTP — generates a new OTP and sends it.
   */
  async resendOtp(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");
    if (user.status !== "ACTIVE") throw ApiError.forbidden("Account is not active");

    const otpResult = await otpService.sendOtp(user.id, user.email, user.firstName);
    return otpResult;
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(refreshToken) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw ApiError.unauthorized("Refresh token has expired");
    }

    if (storedToken.user.status !== "ACTIVE") {
      throw ApiError.forbidden("Account is not active");
    }

    // Rotate: delete old token, issue new pair
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const tokens = await this.generateTokens(storedToken.userId);

    return tokens;
  }

  /**
   * Logout — revoke the refresh token
   */
  async logout(refreshToken) {
    if (!refreshToken) return;

    await prisma.refreshToken
      .delete({ where: { token: refreshToken } })
      .catch(() => {});
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw ApiError.badRequest("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /**
   * Update own profile (name, phone, avatar only)
   */
  async updateProfile(userId, data) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    const allowedFields = {};
    if (data.firstName !== undefined) allowedFields.firstName = data.firstName;
    if (data.lastName !== undefined) allowedFields.lastName = data.lastName;
    if (data.phone !== undefined) allowedFields.phone = data.phone;
    if (data.avatar !== undefined) allowedFields.avatar = data.avatar;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: allowedFields,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  /**
   * Forgot password — sends OTP to user email for password reset.
   * Reuses the OTP infrastructure but with the reset-password email template.
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Don't reveal whether email exists — always return success
    if (!user || user.status !== "ACTIVE") {
      return { otpSent: true, expiryMins: 5, digits: 6 };
    }

    // Invalidate existing OTPs
    await prisma.otp.deleteMany({ where: { userId: user.id } });

    // Get OTP config for digits/expiry
    const otpConfig = await otpService.getOtpConfig();
    const digits = otpConfig.otpDigits || 6;
    const expiryMins = otpConfig.otpExpiryMins || 5;

    // Generate OTP
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const code = crypto.randomInt(min, max + 1).toString();

    // Store OTP
    const expiresAt = new Date(Date.now() + expiryMins * 60 * 1000);
    await prisma.otp.create({
      data: { code, userId: user.id, expiresAt },
    });

    // Send email using reset-password template
    const template = await emailTemplateService.getTemplateBySlug("reset-password");
    const site = await cache.get("site", async () => {
      let s = await prisma.site.findUnique({ where: { id: "default" } });
      if (!s) s = await prisma.site.create({ data: { id: "default" } });
      return s;
    }, 600);
    const siteName = site?.name || "TaskGo Agency";

    // If template has body, use it; otherwise send a simple OTP email
    const { subject, body } = template?.body
      ? emailTemplateService.renderTemplate(template, {
          userName: user.firstName,
          siteName,
          otpCode: code,
          expiryMins: String(expiryMins),
        })
      : {
          subject: `Password Reset OTP — ${siteName}`,
          body: `<p>Hi ${user.firstName},</p><p>Your password reset OTP is: <strong>${code}</strong></p><p>This code expires in ${expiryMins} minutes.</p><p>If you didn't request this, please ignore this email.</p>`,
        };

    await sendMail({ to: user.email, subject, html: body });

    return { otpSent: true, expiryMins, digits };
  }

  /**
   * Reset password with OTP verification.
   */
  async resetPassword(email, otpCode, newPassword) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.badRequest("Invalid request");
    if (user.status !== "ACTIVE") throw ApiError.forbidden("Account is not active");

    // Verify OTP
    await otpService.verifyOtp(user.id, otpCode);

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { passwordReset: true };
  }

  /**
   * Get current user profile
   */
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  }

  /**
   * Generate access + refresh token pair
   */
  async generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    });

    const refreshTokenValue = crypto.randomBytes(40).toString("hex");

    // Parse expiry for DB storage
    const refreshExpiresMs = this.parseExpiry(config.jwt.refreshExpiresIn);

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: config.jwt.accessExpiresIn,
    };
  }

  /**
   * Parse duration string (e.g. "7d", "15m", "1h") to milliseconds
   */
  parseExpiry(duration) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 86400000; // default 7 days
    return parseInt(match[1]) * units[match[2]];
  }
}

export default new AuthService();
