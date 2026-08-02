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

// Sliding idle window. The cookie is stamped client-side by <IdleTracker /> on
// real user interaction only — stamping it here would let background polling
// (notifications refresh every 10s) keep a session alive forever. Middleware
// only reads it and ends the session once it goes stale.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_COOKIE = "lastActivity";

function isIdleExpired(stamp) {
  if (!stamp) return false; // no stamp yet (fresh login) — not idle
  const last = Number(stamp);
  if (!Number.isFinite(last)) return false;
  return Date.now() - last > IDLE_TIMEOUT_MS;
}

/** Redirect to login and wipe the session. */
function forceLogin(request, reason) {
  const url = new URL("/login", request.url);
  if (reason) url.searchParams.set("reason", reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  response.cookies.delete("user");
  response.cookies.delete(ACTIVITY_COOKIE);
  return response;
}

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
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const lastActivity = request.cookies.get(ACTIVITY_COOKIE)?.value;

  let user = null;
  try {
    if (userCookie) user = JSON.parse(userCookie);
  } catch {
    // malformed cookie
  }

  // Check token expiration before deciding if authenticated
  const isExpired = isTokenExpired(accessToken);

  // An expired access token is recoverable while a refresh token is still
  // around — the layout's getAuthUser() mints a new pair during render. Only
  // force re-login once there is nothing left to refresh with.
  if (accessToken && isExpired && !refreshToken) {
    return forceLogin(request);
  }

  const hasSession = (!!accessToken && !isExpired) || !!refreshToken;

  // Idle timeout beats a still-valid refresh token.
  if (hasSession && isIdleExpired(lastActivity)) {
    return forceLogin(request, "idle");
  }

  const isAuthenticated = hasSession && !!user;

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
