import { NextResponse } from "next/server";

/**
 * Middleware — protects role-based panel routes and redirects
 * authenticated users away from /login.
 *
 * Route structure: /{role}/dashboard, /{role}/users, etc.
 * Uses the `user` cookie (non-httpOnly) for quick role checks.
 * The actual token validation happens in each panel layout's
 * server component via getAuthUser().
 */

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

// Which roles can access which route prefix
const ROLE_ACCESS = {
  "/owner": ["OWNER"],
  "/admin": ["OWNER", "ADMIN"],
  "/sales": ["OWNER", "ADMIN", "SALES_MANAGER"],
  "/accounts": ["OWNER", "ADMIN", "ACCOUNT_MANAGER"],
  "/finance": ["OWNER", "ADMIN", "FINANCE_MANAGER"],
  "/hr": ["OWNER", "ADMIN", "HR"],
  "/employee": ["OWNER", "ADMIN", "EMPLOYEE"],
  "/client": ["CLIENT"],
};

// All protected route prefixes
const PROTECTED_PREFIXES = Object.keys(ROLE_ACCESS);

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
  } catch (e) {
    return true;
  }
  return false;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get("user")?.value;
  const accessToken = request.cookies.get("accessToken")?.value;

  let user = null;
  try {
    if (userCookie) user = JSON.parse(userCookie);
  } catch {
    // malformed cookie
  }

  // Check token expiration before deciding if authenticated
  const isExpired = isTokenExpired(accessToken);

  // If token is explicitly expired, clear cookies and force re-login
  if (accessToken && isExpired) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    response.cookies.delete("user");
    return response;
  }

  const isAuthenticated = !!accessToken && !!user && !isExpired;

  // ── Login page: redirect authenticated users to their dashboard ──
  if (pathname === "/login") {
    if (isAuthenticated) {
      const dashPath = ROLE_DASHBOARD_MAP[user.role] || "/admin/dashboard";
      return NextResponse.redirect(new URL(dashPath, request.url));
    }
    return NextResponse.next();
  }

  // ── Protected routes: require authentication ──
  const matchedPrefix = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (matchedPrefix) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access check
    const allowedRoles = ROLE_ACCESS[matchedPrefix];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their correct dashboard
      const correctPath = ROLE_DASHBOARD_MAP[user.role] || "/owner/dashboard";
      return NextResponse.redirect(new URL(correctPath, request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/owner/:path*",
    "/admin/:path*",
    "/sales/:path*",
    "/accounts/:path*",
    "/finance/:path*",
    "/hr/:path*",
    "/employee/:path*",
    "/client/:path*",
  ],
};
