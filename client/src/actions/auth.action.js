"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginAPI, refreshTokenAPI, getMeAPI, logoutAPI } from "@/lib/api";

/* ───────── Role → Dashboard Path Map ───────── */

const ROLE_DASHBOARD_MAP = {
  OWNER: "/admin/dashboard",
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
 * Returns { success, message, redirectTo } or { success: false, message }.
 */
export async function loginAction(prevState, formData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, message: "Email and password are required." };
  }

  try {
    const res = await loginAPI(email, password);
    const { user, tokens } = res.data;

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
 * Validates the access token by calling /me.
 *
 * NOTE: This is called from Server Components (login page, dashboard layouts)
 * which can only READ cookies, not write them. So this function must be
 * read-only — no setAuthCookies or clearAuthCookies here.
 * Token refresh with cookie rotation is handled by the refreshSession action
 * which is only called from Server Actions / Route Handlers.
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
  } catch {
    // Access token invalid/expired — return null, let middleware handle redirect
    return null;
  }
}

/**
 * Refresh session — called as a Server Action only (not from Server Components).
 * Attempts to use the refresh token to get new tokens and update cookies.
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
  } catch {
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
