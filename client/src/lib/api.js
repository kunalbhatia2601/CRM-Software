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
    console.log(data.message.toLowerCase());

    if (data.message.toLowerCase().includes("under maintenance")) {
      if (typeof window !== "undefined") {
        window.location.href = "/maintenance";
        return new Promise(() => { });
      }
    }
    
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

export async function updateProfileAPI(data, accessToken) {
  return request("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function forgotPasswordAPI(email) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordAPI_OTP(email, otpCode, newPassword) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, otpCode, newPassword }),
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

export async function getAiSettings(accessToken) {
  return request("/api/settings/ai", {
    method: "GET",
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

export async function getClientDashboardStatsAPI(accessToken) {
  return request("/api/dashboard/client-stats", {
    method: "GET",
    token: accessToken,
  });
}

export async function getEmployeeDashboardStatsAPI(accessToken) {
  return request("/api/dashboard/employee-stats", {
    method: "GET",
    token: accessToken,
  });
}

export async function getSalesDashboardStatsAPI(accessToken) {
  return request("/api/dashboard/sales-stats", {
    method: "GET",
    token: accessToken,
  });
}

/* ───────── Client Endpoints ───────── */

export async function getClientsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/clients?${query}`, { method: "GET", token: accessToken });
}

export async function getClientAPI(id, accessToken) {
  return request(`/api/clients/${id}`, { method: "GET", token: accessToken });
}

export async function createClientAPI(data, accessToken) {
  return request("/api/clients", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateClientAPI(id, data, accessToken) {
  return request(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteClientAPI(id, accessToken) {
  return request(`/api/clients/${id}`, { method: "DELETE", token: accessToken });
}

export async function getClientsDropdownAPI(accessToken) {
  return request("/api/clients/dropdown", { method: "GET", token: accessToken });
}

/* ───────── Project Endpoints ───────── */

export async function getProjectsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/projects?${query}`, { method: "GET", token: accessToken });
}

export async function getProjectAPI(id, accessToken) {
  return request(`/api/projects/${id}`, { method: "GET", token: accessToken });
}

export async function createProjectAPI(data, accessToken) {
  return request("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateProjectAPI(id, data, accessToken) {
  return request(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteProjectAPI(id, accessToken) {
  return request(`/api/projects/${id}`, { method: "DELETE", token: accessToken });
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

export async function addDealServicesAPI(dealId, services, accessToken) {
  return request(`/api/deals/${dealId}/services`, {
    method: "POST",
    body: JSON.stringify({ services }),
    token: accessToken,
  });
}

export async function removeDealServiceAPI(dealId, serviceId, accessToken) {
  return request(`/api/deals/${dealId}/services/${serviceId}`, {
    method: "DELETE",
    token: accessToken,
  });
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

/* ───────── Service Endpoints ───────── */

export async function getServicesAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/services?${query}`, { method: "GET", token: accessToken });
}

export async function getServiceAPI(id, accessToken) {
  return request(`/api/services/${id}`, { method: "GET", token: accessToken });
}

export async function createServiceAPI(data, accessToken) {
  return request("/api/services", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateServiceAPI(id, data, accessToken) {
  return request(`/api/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteServiceAPI(id, accessToken) {
  return request(`/api/services/${id}`, { method: "DELETE", token: accessToken });
}

export async function getServicesDropdownAPI(accessToken) {
  return request("/api/services/dropdown", { method: "GET", token: accessToken });
}

/* ───────── Storage ───────── */

export async function getUploadConfigAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/storage/upload-config?${query}`, {
    method: "GET",
    token: accessToken,
  });
}

/* ───────── Team Endpoints ───────── */

export async function getTeamsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/teams?${query}`, { method: "GET", token: accessToken });
}

export async function getTeamAPI(id, accessToken) {
  return request(`/api/teams/${id}`, { method: "GET", token: accessToken });
}

export async function createTeamAPI(data, accessToken) {
  return request("/api/teams", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateTeamAPI(id, data, accessToken) {
  return request(`/api/teams/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteTeamAPI(id, accessToken) {
  return request(`/api/teams/${id}`, { method: "DELETE", token: accessToken });
}

export async function getTeamsDropdownAPI(accessToken) {
  return request("/api/teams/dropdown", { method: "GET", token: accessToken });
}

export async function addTeamMemberAPI(teamId, data, accessToken) {
  return request(`/api/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function removeTeamMemberAPI(teamId, userId, accessToken) {
  return request(`/api/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function updateTeamMemberPermissionsAPI(teamId, userId, permissions, accessToken) {
  return request(`/api/teams/${teamId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ permissions }),
    token: accessToken,
  });
}

/* ───────── Global Search ───────── */

export async function globalSearchAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/search?${query}`, { method: "GET", token: accessToken });
}

/* ───────── Notifications ───────── */

export async function getNotificationsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/notifications?${query}`, { method: "GET", token: accessToken });
}

export async function getUnreadCountAPI(accessToken) {
  return request("/api/notifications/unread-count", { method: "GET", token: accessToken });
}

export async function markNotificationReadAPI(id, accessToken) {
  return request(`/api/notifications/${id}/read`, { method: "PATCH", token: accessToken });
}

export async function markAllNotificationsReadAPI(accessToken) {
  return request("/api/notifications/read-all", { method: "PATCH", token: accessToken });
}

export async function deleteNotificationAPI(id, accessToken) {
  return request(`/api/notifications/${id}`, { method: "DELETE", token: accessToken });
}

export async function clearReadNotificationsAPI(accessToken) {
  return request("/api/notifications/clear-read", { method: "DELETE", token: accessToken });
}

/* ───────── System Prompts ───────── */

export async function getSystemPromptsAPI(accessToken) {
  return request("/api/system-prompts", { method: "GET", token: accessToken });
}

export async function getSystemPromptAPI(id, accessToken) {
  return request(`/api/system-prompts/${id}`, { method: "GET", token: accessToken });
}

export async function createSystemPromptAPI(data, accessToken) {
  return request("/api/system-prompts", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateSystemPromptAPI(id, data, accessToken) {
  return request(`/api/system-prompts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteSystemPromptAPI(id, accessToken) {
  return request(`/api/system-prompts/${id}`, { method: "DELETE", token: accessToken });
}

/* ───────── AI ───────── */

export async function aiGenerateAPI(data, accessToken) {
  return request("/api/ai/generate", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function aiSearchAPI(question, accessToken) {
  return request("/api/ai/search", {
    method: "POST",
    body: JSON.stringify({ question }),
    token: accessToken,
  });
}

/* ───────── Documents ───────── */

export async function getDocumentsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/documents?${query}`, { method: "GET", token: accessToken });
}

export async function getDocumentAPI(id, accessToken) {
  return request(`/api/documents/${id}`, { method: "GET", token: accessToken });
}

export async function getDocumentsByDealAPI(dealId, accessToken) {
  return request(`/api/documents/deal/${dealId}`, { method: "GET", token: accessToken });
}

export async function getDocumentsByProjectAPI(projectId, accessToken) {
  return request(`/api/documents/project/${projectId}`, { method: "GET", token: accessToken });
}

export async function createDocumentAPI(data, accessToken) {
  return request("/api/documents", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateDocumentAPI(id, data, accessToken) {
  return request(`/api/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteDocumentAPI(id, accessToken) {
  return request(`/api/documents/${id}`, { method: "DELETE", token: accessToken });
}

export async function sendDocumentEmailAPI(id, data, accessToken) {
  return request(`/api/documents/${id}/send-email`, {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

/* ───────── Meetings ───────── */

export async function getMeetingsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/meetings?${query}`, { method: "GET", token: accessToken });
}

export async function getMeetingAPI(id, accessToken) {
  return request(`/api/meetings/${id}`, { method: "GET", token: accessToken });
}

export async function getMeetingsByLeadAPI(leadId, accessToken) {
  return request(`/api/meetings/lead/${leadId}`, { method: "GET", token: accessToken });
}

export async function getMeetingsByDealAPI(dealId, accessToken) {
  return request(`/api/meetings/deal/${dealId}`, { method: "GET", token: accessToken });
}

export async function getMeetingsByProjectAPI(projectId, accessToken) {
  return request(`/api/meetings/project/${projectId}`, { method: "GET", token: accessToken });
}

export async function createMeetingAPI(data, accessToken) {
  return request("/api/meetings", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateMeetingAPI(id, data, accessToken) {
  return request(`/api/meetings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteMeetingAPI(id, accessToken) {
  return request(`/api/meetings/${id}`, { method: "DELETE", token: accessToken });
}

/* ───────── Follow-Ups ───────── */

export async function getFollowUpsAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/follow-ups?${query}`, { method: "GET", token: accessToken });
}

export async function getFollowUpAPI(id, accessToken) {
  return request(`/api/follow-ups/${id}`, { method: "GET", token: accessToken });
}

export async function getFollowUpsByLeadAPI(leadId, accessToken) {
  return request(`/api/follow-ups/lead/${leadId}`, { method: "GET", token: accessToken });
}

export async function createFollowUpAPI(data, accessToken) {
  return request("/api/follow-ups", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateFollowUpAPI(id, data, accessToken) {
  return request(`/api/follow-ups/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteFollowUpAPI(id, accessToken) {
  return request(`/api/follow-ups/${id}`, { method: "DELETE", token: accessToken });
}

/* ───────── Samples ───────── */

export async function getSamplesAPI(params, accessToken) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/samples?${query}`, { method: "GET", token: accessToken });
}

export async function getSampleAPI(id, accessToken) {
  return request(`/api/samples/${id}`, { method: "GET", token: accessToken });
}

export async function createSampleAPI(data, accessToken) {
  return request("/api/samples", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateSampleAPI(id, data, accessToken) {
  return request(`/api/samples/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteSampleAPI(id, accessToken) {
  return request(`/api/samples/${id}`, { method: "DELETE", token: accessToken });
}

export async function getSamplesDropdownAPI(accessToken) {
  return request("/api/samples/dropdown", { method: "GET", token: accessToken });
}

export async function getSamplesByLeadAPI(leadId, accessToken) {
  return request(`/api/samples/lead/${leadId}`, { method: "GET", token: accessToken });
}

export async function attachSamplesToLeadAPI(leadId, sampleIds, accessToken) {
  return request(`/api/samples/lead/${leadId}`, {
    method: "POST",
    body: JSON.stringify({ sampleIds }),
    token: accessToken,
  });
}

export async function detachSampleFromLeadAPI(leadId, sampleId, accessToken) {
  return request(`/api/samples/lead/${leadId}/${sampleId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

export async function getSamplesByDealAPI(dealId, accessToken) {
  return request(`/api/samples/deal/${dealId}`, { method: "GET", token: accessToken });
}

export async function attachSamplesToDealAPI(dealId, sampleIds, accessToken) {
  return request(`/api/samples/deal/${dealId}`, {
    method: "POST",
    body: JSON.stringify({ sampleIds }),
    token: accessToken,
  });
}

export async function detachSampleFromDealAPI(dealId, sampleId, accessToken) {
  return request(`/api/samples/deal/${dealId}/${sampleId}`, {
    method: "DELETE",
    token: accessToken,
  });
}

/* ───────── Planning Steps ───────── */

export async function getPlanningStepsByProjectAPI(projectId, accessToken) {
  return request(`/api/planning-steps/project/${projectId}`, { method: "GET", token: accessToken });
}

export async function getPlanningStepAPI(id, accessToken) {
  return request(`/api/planning-steps/${id}`, { method: "GET", token: accessToken });
}

export async function createPlanningStepAPI(data, accessToken) {
  return request("/api/planning-steps", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updatePlanningStepAPI(id, data, accessToken) {
  return request(`/api/planning-steps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deletePlanningStepAPI(id, accessToken) {
  return request(`/api/planning-steps/${id}`, { method: "DELETE", token: accessToken });
}

export async function reorderPlanningStepsAPI(projectId, stepIds, accessToken) {
  return request(`/api/planning-steps/project/${projectId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ stepIds }),
    token: accessToken,
  });
}

/* ───────── Tasks ───────── */

export async function getTasksByProjectAPI(projectId, params, accessToken) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request(`/api/tasks/project/${projectId}${query ? `?${query}` : ""}`, { method: "GET", token: accessToken });
}

export async function getMyTasksAPI(params, accessToken) {
  const query = params ? new URLSearchParams(params).toString() : "";
  return request(`/api/tasks/my${query ? `?${query}` : ""}`, { method: "GET", token: accessToken });
}

export async function getTaskAPI(id, accessToken) {
  return request(`/api/tasks/${id}`, { method: "GET", token: accessToken });
}

export async function createTaskAPI(data, accessToken) {
  return request("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateTaskAPI(id, data, accessToken) {
  return request(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteTaskAPI(id, accessToken) {
  return request(`/api/tasks/${id}`, { method: "DELETE", token: accessToken });
}

export async function bulkUpdateTaskStatusAPI(data, accessToken) {
  return request("/api/tasks/bulk-status", {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function addTaskFeedbackAPI(taskId, data, accessToken) {
  return request(`/api/tasks/${taskId}/feedback`, {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function getAssignableUsersAPI(projectId, accessToken) {
  return request(`/api/tasks/project/${projectId}/assignable-users`, { method: "GET", token: accessToken });
}

export async function getChildTasksAPI(taskId, accessToken) {
  return request(`/api/tasks/${taskId}/children`, { method: "GET", token: accessToken });
}

/* ───────── Milestones ───────── */

export async function getMilestonesByProjectAPI(projectId, accessToken) {
  return request(`/api/milestones/project/${projectId}`, { method: "GET", token: accessToken });
}

export async function getMilestoneAPI(id, accessToken) {
  return request(`/api/milestones/${id}`, { method: "GET", token: accessToken });
}

export async function createMilestoneAPI(data, accessToken) {
  return request("/api/milestones", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function updateMilestoneAPI(id, data, accessToken) {
  return request(`/api/milestones/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function deleteMilestoneAPI(id, accessToken) {
  return request(`/api/milestones/${id}`, { method: "DELETE", token: accessToken });
}

export async function reorderMilestonesAPI(projectId, milestoneIds, accessToken) {
  return request(`/api/milestones/project/${projectId}/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ milestoneIds }),
    token: accessToken,
  });
}

/* ───────── Comments ───────── */

export async function createCommentAPI(data, accessToken) {
  return request("/api/comments", {
    method: "POST",
    body: JSON.stringify(data),
    token: accessToken,
  });
}

export async function getCommentsAPI(entityType, entityId, accessToken) {
  return request(`/api/comments/${entityType}/${entityId}`, { method: "GET", token: accessToken });
}

export async function deleteCommentAPI(id, accessToken) {
  return request(`/api/comments/${id}`, { method: "DELETE", token: accessToken });
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
