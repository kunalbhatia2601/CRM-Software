import { Router } from "express";
import authController from "./auth.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation.js";

const router = Router();

// Public routes
// router.post("/register", validate(registerSchema), authController.register); // User Can't Register ThemSelf
router.post("/login", validate(loginSchema), authController.login);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);
router.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.post("/change-password", authenticate, validate(changePasswordSchema), authController.changePassword);
router.patch("/profile", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.get("/me", authenticate, authController.getMe);

export default router;
