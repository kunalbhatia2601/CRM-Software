"use server";

import {
  getCampaignTypesAPI, createCampaignTypeAPI, updateCampaignTypeAPI, deleteCampaignTypeAPI,
  getCampaignsAPI, getCampaignAPI, createCampaignAPI, updateCampaignAPI, deleteCampaignAPI,
  getCampaignStatsAPI, upsertCampaignStatAPI, deleteCampaignStatAPI, getProjectAdBudgetAPI,
  getAdBudgetOverviewAPI, getAdBudgetLedgerAPI, addAdBudgetEntryAPI, deleteAdBudgetEntryAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";

/** Every action returns {success, data|error} — the shape the UI expects. */
async function call(fn, fallback) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await fn(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || fallback };
  }
}

// ─── Types ───

export async function getCampaignTypes(params = {}) {
  return call((t) => getCampaignTypesAPI(params, t), "Failed to load campaign types");
}

export async function createCampaignType(data) {
  return call((t) => createCampaignTypeAPI(data, t), "Failed to create type");
}

export async function updateCampaignType(id, data) {
  return call((t) => updateCampaignTypeAPI(id, data, t), "Failed to update type");
}

export async function deleteCampaignType(id) {
  return call((t) => deleteCampaignTypeAPI(id, t), "Failed to delete type");
}

// ─── Campaigns ───

export async function getCampaigns(params = {}) {
  return call((t) => getCampaignsAPI(params, t), "Failed to load campaigns");
}

export async function getCampaign(id) {
  return call((t) => getCampaignAPI(id, t), "Failed to load campaign");
}

export async function createCampaign(data) {
  return call((t) => createCampaignAPI(data, t), "Failed to create campaign");
}

export async function updateCampaign(id, data) {
  return call((t) => updateCampaignAPI(id, data, t), "Failed to update campaign");
}

export async function deleteCampaign(id) {
  return call((t) => deleteCampaignAPI(id, t), "Failed to delete campaign");
}

// ─── Daily results ───

export async function getCampaignStats(id, params = {}) {
  return call((t) => getCampaignStatsAPI(id, params, t), "Failed to load results");
}

export async function upsertCampaignStat(id, data) {
  return call((t) => upsertCampaignStatAPI(id, data, t), "Failed to record results");
}

export async function deleteCampaignStat(id, date) {
  return call((t) => deleteCampaignStatAPI(id, date, t), "Failed to remove results");
}

// ─── Budget ───

export async function getProjectAdBudget(projectId, params = {}) {
  return call((t) => getProjectAdBudgetAPI(projectId, params, t), "Failed to load ad budget");
}

/** Every project holding ad budget for a period. */
export async function getAdBudgetOverview(params = {}) {
  return call((t) => getAdBudgetOverviewAPI(params, t), "Failed to load ad budget");
}

/** One project's ledger: funds released, and the campaigns drawing on them. */
export async function getAdBudgetLedger(projectId, params = {}) {
  return call((t) => getAdBudgetLedgerAPI(projectId, params, t), "Failed to load ledger");
}

/** Release funds into a project's ad budget. Money roles only. */
export async function addAdBudgetEntry(projectId, data) {
  return call((t) => addAdBudgetEntryAPI(projectId, data, t), "Failed to release funds");
}

export async function deleteAdBudgetEntry(entryId) {
  return call((t) => deleteAdBudgetEntryAPI(entryId, t), "Failed to remove entry");
}
