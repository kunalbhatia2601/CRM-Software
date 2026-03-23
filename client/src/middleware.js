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
  OWNER: "/admin/dashboard",
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

  const isAuthenticated = !!accessToken && !!user;

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
      const correctPath = ROLE_DASHBOARD_MAP[user.role] || "/admin/dashboard";
      return NextResponse.redirect(new URL(correctPath, request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/sales/:path*",
    "/accounts/:path*",
    "/finance/:path*",
    "/hr/:path*",
    "/employee/:path*",
    "/client/:path*",
  ],
};
