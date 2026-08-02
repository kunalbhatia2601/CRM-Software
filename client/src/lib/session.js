/**
 * Session / token helper — server-side only.
 *
 * Every server action calls `getToken()` before hitting the API. That used to
 * read the `accessToken` cookie and nothing else, so the session simply died
 * when the cookie lapsed. Now `getToken()` transparently refreshes an expired
 * (or nearly expired) access token using the long-lived refresh token, giving a
 * rolling session that lasts as long as the refresh token stays valid.
 */

import { cookies } from "next/headers";
import { refreshTokenAPI } from "./api";

// Refresh this many seconds before the token actually expires, so a request
// that is already in flight can't land on the far side of the boundary.
const EXPIRY_SKEW_SECONDS = 60;

// Sliding idle window — must match middleware.js and <IdleTracker />.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_COOKIE = "lastActivity";

const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";
const USER_COOKIE = "user";

// The refresh token is rotated server-side (old row deleted, new pair issued),
// so two concurrent refreshes would make the second one fail and log the user
// out. Share one in-flight promise per refresh token instead.
const inflight = new Map();

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  // Cookies outlive the access JWT on purpose — validity is decided by the
  // token's own `exp`, not by the cookie disappearing underneath us.
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

/**
 * Read a JWT's `exp` claim without verifying it (verification is the server's
 * job — here we only need to know when to ask for a new one).
 *
 * @param {string} token
 * @returns {number|null} epoch seconds, or null if unreadable
 */
function readExpiry(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const exp = JSON.parse(json)?.exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** True when the token is missing, unreadable, or about to expire. */
function isStale(token) {
  if (!token) return true;
  const exp = readExpiry(token);
  if (exp === null) return false; // can't tell — let the API decide
  return exp - EXPIRY_SKEW_SECONDS <= Math.floor(Date.now() / 1000);
}

/** Persist a fresh token pair. Silently no-ops outside a writable context. */
export async function writeAuthCookies(tokens, user = null) {
  const store = await cookies();
  const opts = baseCookieOptions();

  try {
    store.set(ACCESS_COOKIE, tokens.accessToken, opts);
    store.set(REFRESH_COOKIE, tokens.refreshToken, opts);

    if (user) {
      // Non-httpOnly — the client reads this for role-based UI rendering.
      store.set(
        USER_COOKIE,
        JSON.stringify({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          avatar: user.avatar || null,
        }),
        { ...opts, httpOnly: false }
      );
    }
  } catch {
    // Server Components can't set cookies. The refreshed token is still
    // returned to the caller for this request; the next Server Action or Route
    // Handler will persist one.
  }
}

/** Drop every auth cookie. Safe to call from a read-only context. */
export async function clearAuthCookies() {
  const store = await cookies();
  try {
    store.delete(ACCESS_COOKIE);
    store.delete(REFRESH_COOKIE);
    store.delete(USER_COOKIE);
  } catch {
    // read-only context — nothing to do
  }
}

/**
 * Exchange the refresh token for a new pair, deduped across concurrent callers.
 *
 * @param {string} refreshToken
 * @returns {Promise<{accessToken: string, refreshToken: string}|null>}
 */
async function refreshTokens(refreshToken) {
  if (inflight.has(refreshToken)) return inflight.get(refreshToken);

  const task = (async () => {
    try {
      const res = await refreshTokenAPI(refreshToken);
      const tokens = res?.data;
      if (!tokens?.accessToken) return null;
      await writeAuthCookies(tokens);
      return tokens;
    } catch {
      // Refresh token expired, revoked, or the account was deactivated.
      await clearAuthCookies();
      return null;
    } finally {
      inflight.delete(refreshToken);
    }
  })();

  inflight.set(refreshToken, task);
  return task;
}

/**
 * Current access token, refreshed on the fly when stale.
 * Returns undefined when there is no usable session.
 *
 * @returns {Promise<string|undefined>}
 */
export async function getToken() {
  const store = await cookies();

  // Idle timeout wins over a still-valid refresh token: refuse to renew a
  // session the user walked away from.
  const stamp = Number(store.get(ACTIVITY_COOKIE)?.value);
  if (Number.isFinite(stamp) && Date.now() - stamp > IDLE_TIMEOUT_MS) {
    await clearAuthCookies();
    return undefined;
  }

  const access = store.get(ACCESS_COOKIE)?.value;

  if (!isStale(access)) return access;

  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (!refresh) return access; // nothing to refresh with

  const tokens = await refreshTokens(refresh);
  return tokens?.accessToken ?? undefined;
}
