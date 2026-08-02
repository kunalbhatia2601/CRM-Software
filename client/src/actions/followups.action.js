"use server";

import {
  getFollowUpsAPI,
  getFollowUpAPI,
  getFollowUpsByLeadAPI,
  createFollowUpAPI,
  updateFollowUpAPI,
  deleteFollowUpAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getFollowUps(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getFollowUpsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getFollowUp(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getFollowUpAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getFollowUpsByLead(leadId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getFollowUpsByLeadAPI(leadId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function createFollowUp(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createFollowUpAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateFollowUp(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateFollowUpAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteFollowUp(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteFollowUpAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
