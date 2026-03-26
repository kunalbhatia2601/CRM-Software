import authService from "./auth.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import cache from "../../utils/cache.js";

const USER_CACHE_TTL = 5 * 60; // 5 minutes

class AuthController {
  /**
   * POST /api/auth/register
   */
  register = catchAsync(async (req, res) => {
    const result = await authService.register(req.body);
    return created(res, "User registered successfully", result);
  });

  /**
   * POST /api/auth/login
   * Returns either { otpRequired: true, userId, ... } or { user, tokens }
   */
  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (result.otpRequired) {
      return ok(res, "OTP sent to your email", result);
    }

    return ok(res, "Login successful", result);
  });

  /**
   * POST /api/auth/verify-otp
   * Verifies OTP and returns tokens on success.
   */
  verifyOtp = catchAsync(async (req, res) => {
    const { userId, otpCode } = req.body;
    const result = await authService.verifyLoginOtp(userId, otpCode);
    return ok(res, "OTP verified successfully", result);
  });

  /**
   * POST /api/auth/resend-otp
   * Resends a new OTP to the user.
   */
  resendOtp = catchAsync(async (req, res) => {
    const { userId } = req.body;
    const result = await authService.resendOtp(userId);
    return ok(res, "OTP resent successfully", result);
  });

  /**
   * POST /api/auth/refresh-token
   */
  refreshToken = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    cache.del(`user:${req.user.id}`);
    return ok(res, "Token refreshed successfully", tokens);
  });

  /**
   * POST /api/auth/logout
   */
  logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    cache.del(`user:${req.user.id}`);
    return ok(res, "Logged out successfully");
  });

  /**
   * POST /api/auth/change-password
   */
  changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    cache.del(`user:${req.user.id}`);
    return ok(res, "Password changed successfully");
  });

  /**
   * PATCH /api/auth/profile
   */
  updateProfile = catchAsync(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);
    cache.del(`user:${req.user.id}`);
    return ok(res, "Profile updated successfully", user);
  });

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return ok(res, "If an account exists with this email, an OTP has been sent", result);
  });

  /**
   * POST /api/auth/reset-password
   */
  resetPassword = catchAsync(async (req, res) => {
    const { email, otpCode, newPassword } = req.body;
    const result = await authService.resetPassword(email, otpCode, newPassword);
    return ok(res, "Password reset successfully", result);
  });

  /**
   * GET /api/auth/me
   * Add cache for 5 minutes
   */
  getMe = catchAsync(async (req, res) => {
    const cacheKey = `user:${req.user.id}`;

    const user = await cache.get(cacheKey, async () => {
      return await authService.getMe(req.user.id);
    }, USER_CACHE_TTL);

    return ok(res, "User profile retrieved", user);
  });
}

export default new AuthController();
