"use server";

import { cookies } from "next/headers";
import {
  getSamplesAPI,
  getSampleAPI,
  createSampleAPI,
  updateSampleAPI,
  deleteSampleAPI,
  getSamplesDropdownAPI,
  getSamplesByLeadAPI,
  attachSamplesToLeadAPI,
  detachSampleFromLeadAPI,
  getSamplesByDealAPI,
  attachSamplesToDealAPI,
  detachSampleFromDealAPI,
} from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

// ─── CRUD ────────────────────────────────────────────────

export async function getSamples(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getSamplesAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch samples" };
  }
}

export async function getSample(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getSampleAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch sample" };
  }
}

export async function createSample(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createSampleAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create sample" };
  }
}

export async function updateSample(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateSampleAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update sample" };
  }
}

export async function deleteSample(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteSampleAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete sample" };
  }
}

export async function getSamplesDropdown() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getSamplesDropdownAPI(token);
    if (res.success) return res.data || [];
    return [];
  } catch {
    return [];
  }
}

// ─── Lead ↔ Sample ──────────────────────────────────────

export async function getSamplesByLead(leadId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getSamplesByLeadAPI(leadId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch lead samples" };
  }
}

export async function attachSamplesToLead(leadId, sampleIds) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await attachSamplesToLeadAPI(leadId, sampleIds, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to attach samples" };
  }
}

export async function detachSampleFromLead(leadId, sampleId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await detachSampleFromLeadAPI(leadId, sampleId, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to detach sample" };
  }
}

// ─── Deal ↔ Sample ──────────────────────────────────────

export async function getSamplesByDeal(dealId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getSamplesByDealAPI(dealId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch deal samples" };
  }
}

export async function attachSamplesToDeal(dealId, sampleIds) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await attachSamplesToDealAPI(dealId, sampleIds, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to attach samples" };
  }
}

export async function detachSampleFromDeal(dealId, sampleId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await detachSampleFromDealAPI(dealId, sampleId, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to detach sample" };
  }
}
