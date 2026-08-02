"use server";

import {
  getMeetingsAPI,
  getMeetingAPI,
  getMeetingsByLeadAPI,
  getMeetingsByDealAPI,
  getMeetingsByProjectAPI,
  createMeetingAPI,
  updateMeetingAPI,
  deleteMeetingAPI,
  completePostProductionMeetingAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getMeetings(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getMeetingsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getMeeting(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getMeetingAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getMeetingsByLead(leadId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getMeetingsByLeadAPI(leadId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getMeetingsByDeal(dealId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getMeetingsByDealAPI(dealId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getMeetingsByProject(projectId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getMeetingsByProjectAPI(projectId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function createMeeting(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createMeetingAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateMeeting(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateMeetingAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteMeeting(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteMeetingAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Complete a POST_PRODUCTION meeting with structured per-task feedback.
 * data: { outcome?, taskFeedbacks: [{ taskId, feedback?, nextStep?, statusAfter? }] }
 */
export async function completePostProductionMeeting(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await completePostProductionMeetingAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
