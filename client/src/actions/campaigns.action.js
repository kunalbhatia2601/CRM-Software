"use server";

import { cookies } from "next/headers";
import {
  getCampaignsAPI,
  getCampaignAPI,
  getCampaignOverviewAPI,
  getCampaignInsightsAPI,
  getCampaignDailyInsightsAPI,
  getCampaignAdSetsAPI,
  getCampaignAdsAPI,
  updateCampaignStatusAPI,
  testMetaConnectionAPI,
  getLeadFormsAPI,
  getLeadFormDataAPI,
} from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

// ─── Account Overview ────────────────────────────────────

export async function getCampaignOverview(datePreset = "last_30d") {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getCampaignOverviewAPI({ datePreset }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch overview" };
  }
}

// ─── List Campaigns ──────────────────────────────────────

export async function getCampaigns(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getCampaignsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch campaigns" };
  }
}

// ─── Get Single Campaign ─────────────────────────────────

export async function getCampaign(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getCampaignAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch campaign" };
  }
}

// ─── Campaign Insights ───────────────────────────────────

export async function getCampaignInsightsAction(id, datePreset = "last_30d") {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getCampaignInsightsAPI(id, { datePreset }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch insights" };
  }
}

// ─── Daily Insights (Charts) ─────────────────────────────

export async function getCampaignDailyInsightsAction(id, datePreset = "last_30d") {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getCampaignDailyInsightsAPI(id, { datePreset }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch daily insights" };
  }
}

// ─── Ad Sets ─────────────────────────────────────────────

export async function getCampaignAdSetsAction(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getCampaignAdSetsAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch ad sets" };
  }
}

// ─── Ads ─────────────────────────────────────────────────

export async function getCampaignAdsAction(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getCampaignAdsAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch ads" };
  }
}

// ─── Update Campaign Status ──────────────────────────────

export async function updateCampaignStatus(id, status) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateCampaignStatusAPI(id, status, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update campaign status" };
  }
}

// ─── Test Meta Connection ────────────────────────────────

export async function testMetaConnection() {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await testMetaConnectionAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to test connection" };
  }
}

// ─── Lead Forms ──────────────────────────────────────────

export async function getLeadForms() {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getLeadFormsAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch lead forms" };
  }
}

export async function getLeadFormLeads(formId, params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getLeadFormDataAPI(formId, params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch lead form data" };
  }
}
