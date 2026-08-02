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
const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

function isIdleExpired(stamp) {
  if (!stamp) return false; // no stamp yet (fresh login) — not idle
  const last = Number(stamp);
  if (!Number.isFinite(last)) return false;
  return Date.now() - last > IDLE_TIMEOUT_MS;
}

/**
 * Wipe the session. Clears cookies on the way out so a dead refresh token can
 * never be replayed — that is what turns a failed refresh into a redirect loop.
 */
function forceLogin(request, reason, targetUrl) {
  const url = targetUrl || new URL("/login", request.url);
  if (reason) url.searchParams.set("reason", reason);

  // Already on /login: clear cookies in place instead of redirecting to
  // ourselves, otherwise the browser loops.
  const response =
    request.nextUrl.pathname === "/login"
      ? NextResponse.next()
      : NextResponse.redirect(url);
  for (const name of ["accessToken", "refreshToken", "user", ACTIVITY_COOKIE]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}

const API_BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4444";

const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days — validity comes from the JWT's own exp
};

// The server rotates destructively (old refresh row deleted before the new
// pair is issued), so two concurrent refreshes with the same token would make
// the second fail and kill the session. Collapse them into one call.
const inflightRefresh = new Map();

/**
 * Exchange a refresh token for a new pair.
 * @returns {Promise<{accessToken: string, refreshToken: string}|null>} null when the token is dead
 */
async function refreshPair(refreshToken) {
  if (inflightRefresh.has(refreshToken)) return inflightRefresh.get(refreshToken);

  const task = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body?.data?.accessToken ? body.data : null;
    } catch {
      return null;
    } finally {
      inflightRefresh.delete(refreshToken);
    }
  })();

  inflightRefresh.set(refreshToken, task);
  return task;
}

function applyTokens(response, tokens) {
  response.cookies.set("accessToken", tokens.accessToken, TOKEN_COOKIE_OPTIONS);
  response.cookies.set("refreshToken", tokens.refreshToken, TOKEN_COOKIE_OPTIONS);
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

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const userCookie = request.cookies.get("user")?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const lastActivity = request.cookies.get(ACTIVITY_COOKIE)?.value;

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  let user = null;
  try {
    if (userCookie) user = JSON.parse(userCookie);
  } catch {
    // malformed cookie
  }

  // Idle timeout is checked first — it outranks any still-valid token.
  if ((accessToken || refreshToken) && isIdleExpired(lastActivity)) {
    return forceLogin(request, "idle");
  }

  // ── Token renewal ────────────────────────────────────────
  // This is the only place a refresh may happen. Server Components cannot
  // write cookies, so refreshing during render would rotate the token
  // server-side with no way to persist the new one — the next request would
  // then present a token the server has already deleted.
  let renewed = null;
  if (isTokenExpired(accessToken)) {
    if (!refreshToken) {
      // Nothing left to renew with.
      return accessToken || user ? forceLogin(request) : continueUnauthenticated(request, pathname);
    }

    renewed = await refreshPair(refreshToken);
    if (!renewed) {
      // Refresh token is expired, revoked, or already rotated away.
      return forceLogin(request, "expired");
    }
    accessToken = renewed.accessToken;
  }

  const isAuthenticated = !!accessToken && !isTokenExpired(accessToken) && !!user;

  // Hand the freshly minted token to the render pass, which sees the *request*
  // cookies (the response cookies above only reach the browser).
  const forward = () => {
    const headers = new Headers(request.headers);
    if (renewed) headers.set("x-access-token", renewed.accessToken);
    const response = NextResponse.next({ request: { headers } });
    return renewed ? applyTokens(response, renewed) : response;
  };

  const redirectTo = (url) => {
    const response = NextResponse.redirect(url);
    return renewed ? applyTokens(response, renewed) : response;
  };

  // ── Login page: redirect authenticated users to their dashboard ──
  if (pathname === "/login") {
    if (isAuthenticated) {
      const dashPath = ROLE_DASHBOARD_MAP[user.role] || "/admin/dashboard";
      return redirectTo(new URL(dashPath, request.url));
    }
    return forward();
  }

  // ── Protected routes: require authentication ──
  const matchedPrefix = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (matchedPrefix) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return forceLogin(request, null, loginUrl);
    }

    const allowedRoles = ROLE_ACCESS[matchedPrefix];
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const correctPath = ROLE_DASHBOARD_MAP[user.role] || "/owner/dashboard";
      return redirectTo(new URL(correctPath, request.url));
    }

    return forward();
  }

  return forward();
}

/** No session at all — let /login through, bounce protected routes. */
function continueUnauthenticated(request, pathname) {
  const matched = PROTECTED_PREFIXES.find(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (!matched) return NextResponse.next();
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
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
