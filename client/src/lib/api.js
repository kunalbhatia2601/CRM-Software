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

export async function verifyOtpAPI(userId, otpCode) {
  return request("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ userId, otpCode }),
  });
}

export async function resendOtpAPI(userId) {
  return request("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

/* ───────── Site Endpoint ───────── */

export async function getSiteAPI() {
  return request("/api/site", { method: "GET", cache: "no-store" });
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

export async function getDashboardStatsAPI(accessToken, period = "month") {
  const query = period ? `?period=${period}` : "";
  return request(`/api/dashboard/stats${query}`, {
    method: "GET",
    token: accessToken,
  });
}

/* ───────── Client Endpoints ───────── */

export async function getClientsDropdownAPI(accessToken) {
  return request("/api/clients/dropdown", { method: "GET", token: accessToken });
}

/* ───────── User Endpoints ───────── */

export async function getUsersAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/users?${query}`, { method: "GET", token: accessToken });
}

export async function getUserAPI(id, accessToken) {
  return request(`/api/users/${id}`, { method: "GET", token: accessToken });
}

export async function getUserReportAPI(id, accessToken) {
  return request(`/api/users/${id}/report`, { method: "GET", token: accessToken });
}

export async function createUserAPI(data, accessToken) {
  return request("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateUserAPI(id, data, accessToken) {
  return request(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteUserAPI(id, accessToken) {
  return request(`/api/users/${id}`, { method: "DELETE", token: accessToken });
}

export async function resetPasswordAPI(id, newPassword, accessToken) {
  return request(`/api/users/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
    token: accessToken,
  });
}

/* ───────── Lead Endpoints ───────── */

export async function getLeadsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/leads?${query}`, { method: "GET", token: accessToken });
}

export async function getLeadAPI(id, accessToken) {
  return request(`/api/leads/${id}`, { method: "GET", token: accessToken });
}

export async function createLeadAPI(data, accessToken) {
  return request("/api/leads", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateLeadAPI(id, data, accessToken) {
  return request(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateLeadStatusAPI(id, data, accessToken) {
  return request(`/api/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteLeadAPI(id, accessToken) {
  return request(`/api/leads/${id}`, { method: "DELETE", token: accessToken });
}

/* ───────── Deal Endpoints ───────── */

export async function getDealsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/deals?${query}`, { method: "GET", token: accessToken });
}

export async function getDealAPI(id, accessToken) {
  return request(`/api/deals/${id}`, { method: "GET", token: accessToken });
}

export async function createDealAPI(data, accessToken) {
  return request("/api/deals", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateDealAPI(id, data, accessToken) {
  return request(`/api/deals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateDealStageAPI(id, data, accessToken) {
  return request(`/api/deals/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteDealAPI(id, accessToken) {
  return request(`/api/deals/${id}`, { method: "DELETE", token: accessToken });
}

/* ───────── Email Template Endpoints ───────── */

export async function getEmailTemplatesAPI(accessToken) {
  return request("/api/email-templates", { method: "GET", token: accessToken });
}

export async function getEmailTemplateAPI(id, accessToken) {
  return request(`/api/email-templates/${id}`, { method: "GET", token: accessToken });
}

export async function updateEmailTemplateAPI(id, data, accessToken) {
  return request(`/api/email-templates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

/* ───────── Campaign (Meta) Endpoints ───────── */

export async function getCampaignsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/campaigns?${query}`, { method: "GET", token: accessToken });
}

export async function getCampaignAPI(id, accessToken) {
  return request(`/api/campaigns/${id}`, { method: "GET", token: accessToken });
}

export async function getCampaignOverviewAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/campaigns/overview?${query}`, { method: "GET", token: accessToken });
}

export async function getCampaignInsightsAPI(id, params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/campaigns/${id}/insights?${query}`, { method: "GET", token: accessToken });
}

export async function getCampaignDailyInsightsAPI(id, params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/campaigns/${id}/insights/daily?${query}`, { method: "GET", token: accessToken });
}

export async function getCampaignAdSetsAPI(id, accessToken) {
  return request(`/api/campaigns/${id}/adsets`, { method: "GET", token: accessToken });
}

export async function getCampaignAdsAPI(id, accessToken) {
  return request(`/api/campaigns/${id}/ads`, { method: "GET", token: accessToken });
}

export async function updateCampaignStatusAPI(id, status, accessToken) {
  return request(`/api/campaigns/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    token: accessToken,
  });
}

export async function testMetaConnectionAPI(accessToken) {
  return request("/api/campaigns/test-connection", { method: "GET", token: accessToken });
}

export async function getLeadFormsAPI(accessToken) {
  return request("/api/campaigns/lead-forms", { method: "GET", token: accessToken });
}

export async function getLeadFormDataAPI(formId, params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/campaigns/lead-forms/${formId}/leads?${query}`, { method: "GET", token: accessToken });
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
