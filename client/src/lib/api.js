/**
 * API Utility — centralised HTTP client for TaskGo backend.
 * Uses NEXT_PUBLIC_SERVER_URL from env for the base URL.
 * Provides typed helpers for every auth & resource endpoint.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4444";

/**
 * Core request helper.
 * Automatically attaches JSON headers and parses the response.
 * Throws a structured error on non-2xx status.
 */
async function request(endpoint, options = {}) {
  const { token, ...fetchOptions } = options;

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || "Something went wrong");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/* ───────── Auth Endpoints ───────── */

export async function loginAPI(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshTokenAPI(refreshToken) {
  return request("/api/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logoutAPI(refreshToken, accessToken) {
  return request("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    token: accessToken,
  });
}

export async function getMeAPI(accessToken) {
  return request("/api/auth/me", {
    method: "GET",
    token: accessToken,
  });
}

export async function changePasswordAPI(accessToken, currentPassword, newPassword) {
  return request("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
    token: accessToken,
  });
}

/* ───────── Site Endpoint ───────── */

export async function getSiteAPI() {
  return request("/api/site", { method: "GET" });
}

export async function updateSiteAPI(data, accessToken) {
  return request("/api/site", {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

/* ───────── Settings Endpoints ───────── */

export async function getSettingsAPI(accessToken) {
  return request("/api/settings", {
    method: "GET",
    token: accessToken,
  });
}

export async function updateSettingsAPI(data, accessToken) {
  return request("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

/* ───────── Dashboard Endpoint ───────── */

export async function getDashboardStatsAPI(accessToken) {
  return request("/api/dashboard/stats", {
    method: "GET",
    token: accessToken,
  });
}

/* ───────── Generic Authenticated Requests ───────── */

export async function apiGet(endpoint, accessToken) {
  return request(endpoint, { method: "GET", token: accessToken });
}

export async function apiPost(endpoint, body, accessToken) {
  return request(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    token: accessToken,
  });
}

export async function apiPut(endpoint, body, accessToken) {
  return request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
    token: accessToken,
  });
}

export async function apiPatch(endpoint, body, accessToken) {
  return request(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
    token: accessToken,
  });
}

export async function apiDelete(endpoint, accessToken) {
  return request(endpoint, { method: "DELETE", token: accessToken });
}

export default request;
