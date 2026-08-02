"use server";

import { cookies } from "next/headers";
import {
  getDealsAPI,
  getDealAPI,
  createDealAPI,
  updateDealAPI,
  updateDealStageAPI,
  deleteDealAPI,
  addDealServicesAPI,
  removeDealServiceAPI,
  getUsersAPI,
  getLeadsAPI,
} from "@/lib/api";
import { getAssignableStaff } from "./users.action";

// ─── Helpers ─────────────────────────────────────────────

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

// ─── List Deals ──────────────────────────────────────────

export async function getDeals(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getDealsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch deals" };
  }
}

// ─── Get Single Deal ─────────────────────────────────────

export async function getDeal(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getDealAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch deal" };
  }
}

// ─── Create Deal ─────────────────────────────────────────

export async function createDeal(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createDealAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create deal" };
  }
}

// ─── Update Deal ─────────────────────────────────────────

export async function updateDeal(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateDealAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update deal" };
  }
}

// ─── Update Deal Stage ───────────────────────────────────

export async function updateDealStage(id, stage, lostReason, accountManagerId, projectConfig, documents, clientEmail) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const body = { stage };
    if (lostReason) body.lostReason = lostReason;
    if (accountManagerId) body.accountManagerId = accountManagerId;
    if (projectConfig) body.projectConfig = projectConfig;
    if (documents && documents.length > 0) body.documents = documents;
    if (clientEmail) body.clientEmail = clientEmail;
    const res = await updateDealStageAPI(id, body, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update deal stage" };
  }
}

// ─── Delete Deal ─────────────────────────────────────────

export async function deleteDeal(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteDealAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete deal" };
  }
}

// ─── Add Services to Deal ────────────────────────────────

export async function addServicesToDeal(dealId, services) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await addDealServicesAPI(dealId, services, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to add services" };
  }
}

// ─── Remove Service from Deal ────────────────────────────

export async function removeServiceFromDeal(dealId, serviceId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await removeDealServiceAPI(dealId, serviceId, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to remove service" };
  }
}

// ─── Get Qualified Leads (for deal creation dropdown) ────

export async function getQualifiedLeads() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getLeadsAPI({ status: "QUALIFIED", limit: 100 }, token);
    if (res.success) {
      return res.data.leads.map((l) => ({
        id: l.id,
        companyName: l.companyName,
        contactName: l.contactName,
        estimatedValue: l.estimatedValue,
        assigneeId: l.assigneeId,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Get Assignable Users ────────────────────────────────

export async function getDealAssignableUsers() {
  return getAssignableStaff();
}

// ─── Get Account Managers (for WON stage) ────────────────

export async function getAccountManagers() {
  return getAssignableStaff();
}
