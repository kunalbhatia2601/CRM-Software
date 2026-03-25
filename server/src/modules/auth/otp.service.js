import crypto from "crypto";
import prisma from "../../utils/prisma.js";
import cache from "../../utils/cache.js";
import { sendMail } from "../../utils/mailer.js";
import emailTemplateService from "../email-template/email-template.service.js";
import { ApiError } from "../../utils/apiError.js";

const MAX_ATTEMPTS = 5; // Max wrong OTP attempts before invalidation

class OtpService {
  /**
   * Check if OTP login is enabled and SMTP is configured.
   * Uses cached settings — no DB call on every login attempt.
   */
  async getOtpConfig() {
    const settings = await cache.get("settings:raw", async () => {
      let s = await prisma.settings.findUnique({ where: { id: "default" } });
      if (!s) s = await prisma.settings.create({ data: { id: "default" } });
      return s;
    }, 600);

    if (!settings) return { enabled: false };

    const smtpReady = !!(
      settings.smtpHost &&
      settings.smtpPort &&
      settings.smtpEmail &&
      settings.smtpPassword
    );

    return {
      enabled: settings.otpLoginEnabled && smtpReady,
      otpDigits: settings.otpDigits || 6,
      otpExpiryMins: settings.otpExpiryMins || 5,
    };
  }

  /**
   * Generate and send an OTP to the user.
   * Invalidates any existing OTPs for this user first.
   */
  async sendOtp(userId, email, firstName) {
    const otpConfig = await this.getOtpConfig();
    if (!otpConfig.enabled) {
      throw ApiError.badRequest("OTP login is not enabled");
    }

    // Invalidate any existing OTPs for this user
    await prisma.otp.deleteMany({ where: { userId } });

    // Generate OTP code
    const digits = otpConfig.otpDigits;
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    const code = crypto.randomInt(min, max + 1).toString();

    // Store OTP
    const expiresAt = new Date(Date.now() + otpConfig.otpExpiryMins * 60 * 1000);
    await prisma.otp.create({
      data: { code, userId, expiresAt },
    });

    // Get email template (cached) and site name (cached)
    const template = await emailTemplateService.getTemplateBySlug("login-otp");
    const site = await cache.get("site", async () => {
      let s = await prisma.site.findUnique({ where: { id: "default" } });
      if (!s) s = await prisma.site.create({ data: { id: "default" } });
      return s;
    }, 600);
    const siteName = site?.name || "TaskGo Agency";

    const { subject, body } = emailTemplateService.renderTemplate(template, {
      otpCode: code,
      userName: firstName,
      siteName,
      expiryMins: String(otpConfig.otpExpiryMins),
      otpDigits: String(digits),
    });

    // Send email
    await sendMail({ to: email, subject, html: body });

    return {
      otpSent: true,
      expiryMins: otpConfig.otpExpiryMins,
      digits: otpConfig.otpDigits,
    };
  }

  /**
   * Verify an OTP code for a user.
   * Returns true if valid, throws on failure.
   */
  async verifyOtp(userId, code) {
    const otp = await prisma.otp.findFirst({
      where: { userId, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw ApiError.badRequest("No OTP found. Please request a new one.");
    }

    // Check expiry
    if (otp.expiresAt < new Date()) {
      await prisma.otp.delete({ where: { id: otp.id } });
      throw ApiError.badRequest("OTP has expired. Please request a new one.");
    }

    // Check attempts
    if (otp.attempts >= MAX_ATTEMPTS) {
      await prisma.otp.delete({ where: { id: otp.id } });
      throw ApiError.badRequest("Too many incorrect attempts. Please request a new OTP.");
    }

    // Verify code
    if (otp.code !== code) {
      await prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - otp.attempts - 1;
      throw ApiError.badRequest(
        `Invalid OTP. ${remaining > 0 ? `${remaining} attempt${remaining > 1 ? "s" : ""} remaining.` : "No attempts remaining."}`
      );
    }

    // Mark as verified and clean up
    await prisma.otp.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    // Clean up all OTPs for this user
    await prisma.otp.deleteMany({ where: { userId } });

    return true;
  }
}

export default new OtpService();
