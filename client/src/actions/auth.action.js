"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAPI, refreshTokenAPI, getMeAPI, logoutAPI, verifyOtpAPI, resendOtpAPI, forgotPasswordAPI, resetPasswordAPI_OTP } from "@/lib/api";
import { checkForMaintenance } from "@/lib/checkForMaintainence";

/* ───────── Role → Dashboard Path Map ───────── */

const ROLE_DASHBOARD_MAP = {
  OWNER: "/owner/dashboard",
  ADMIN: "/admin/dashboard",
  SALES_MANAGER: "/sales/dashboard",
  ACCOUNT_MANAGER: "/accounts/dashboard",
  FINANCE_MANAGER: "/finance/dashboard",
  HR: "/hr/dashboard",
  EMPLOYEE: "/employee/dashboard",
  CLIENT: "/client/dashboard",
};

function getDashboardPath(role) {
  return ROLE_DASHBOARD_MAP[role] || "/dashboard";
}

/* ───────── Cookie Helpers ───────── */

async function setAuthCookies(tokens, user) {
  const cookieStore = await cookies();

  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour (access token)
  });

  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  // Non-httpOnly cookie for client-side role-based UI rendering
  cookieStore.set(
    "user",
    JSON.stringify({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar || null,
    }),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }
  );
}

async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("user");
}

/* ───────── Server Actions ───────── */

/**
 * Login action — called from the login form.
 * Returns either:
 *   { success: true, otpRequired: true, userId, email, expiryMins, digits }
 *   { success: true, redirectTo, user }
 *   { success: false, message }
 */
export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, message: "Email and password are required." };
  }

  try {
    const res = await loginAPI(email, password);
    const data = res.data;

    // OTP required — don't set cookies yet
    if (data.otpRequired) {
      return {
        success: true,
        otpRequired: true,
        userId: data.userId,
        email: data.email,
        expiryMins: data.expiryMins,
        digits: data.digits,
        message: res.message || "OTP sent to your email",
      };
    }

    // Direct login — set cookies and redirect
    const { user, tokens } = data;
    await setAuthCookies(tokens, user);
    const redirectTo = getDashboardPath(user.role);

    return { success: true, message: "Login successful", redirectTo, user };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Invalid email or password.",
    };
  }
}

/**
 * Verify OTP action — called from the OTP step of login.
 */
export async function verifyOtpAction(userId, otpCode) {
  try {
    const res = await verifyOtpAPI(userId, otpCode);
    const { user, tokens } = res.data;

    await setAuthCookies(tokens, user);
    const redirectTo = getDashboardPath(user.role);

    return { success: true, message: "OTP verified successfully", redirectTo, user };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Invalid OTP code.",
    };
  }
}

/**
 * Resend OTP action.
 */
export async function resendOtpAction(userId) {
  try {
    const res = await resendOtpAPI(userId);
    return {
      success: true,
      message: "OTP resent successfully",
      expiryMins: res.data.expiryMins,
      digits: res.data.digits,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to resend OTP.",
    };
  }
}

/**
 * Logout action — revokes tokens and clears cookies.
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (refreshToken && accessToken) {
      await logoutAPI(refreshToken, accessToken).catch(() => {});
    }
  } finally {
    await clearAuthCookies();
  }

  redirect("/");
}

/**
 * Get the current authenticated user from cookies.
 */
export async function getAuthUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const res = await getMeAPI(accessToken);
    return res.data;
  } catch (error) {
    checkForMaintenance(error);
    return null;
  }
}

/**
 * Refresh session — called as a Server Action only.
 */
export async function refreshSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    await clearAuthCookies();
    return null;
  }

  try {
    const res = await refreshTokenAPI(refreshToken);
    const newTokens = res.data;

    const meRes = await getMeAPI(newTokens.accessToken);
    await setAuthCookies(newTokens, meRes.data);

    return meRes.data;
  } catch (error) {
    checkForMaintenance(error);
    await clearAuthCookies();
    return null;
  }
}

/**
 * Returns the dashboard path for the current user.
 */
export async function getRedirectPath() {
  const user = await getAuthUser();
  if (!user) return "/login";
  return getDashboardPath(user.role);
}

/**
 * Forgot password — sends OTP to user email.
 */
export async function forgotPasswordAction(email) {
  try {
    const res = await forgotPasswordAPI(email);
    return {
      success: true,
      message: res.message || "If an account exists, an OTP has been sent",
      expiryMins: res.data?.expiryMins || 5,
      digits: res.data?.digits || 6,
    };
  } catch (error) {
    // Don't reveal if email exists or not
    return {
      success: true,
      message: "If an account exists with this email, an OTP has been sent",
      expiryMins: 5,
      digits: 6,
    };
  }
}

/**
 * Reset password with OTP.
 */
export async function resetPasswordAction(email, otpCode, newPassword) {
  try {
    await resetPasswordAPI_OTP(email, otpCode, newPassword);
    return { success: true, message: "Password reset successfully. You can now sign in." };
  } catch (error) {
    return { success: false, message: error.message || "Failed to reset password" };
  }
}
