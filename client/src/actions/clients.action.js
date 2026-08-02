"use server";

import { cookies } from "next/headers";
import {
  getClientsAPI,
  getClientAPI,
  createClientAPI,
  updateClientAPI,
  deleteClientAPI,
  getClientsDropdownAPI,
  getUsersAPI,
} from "@/lib/api";
import { getAssignableStaff } from "./users.action";

// ─── Helpers ─────────────────────────────────────────────

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

// ─── List Clients ────────────────────────────────────────

export async function getClients(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getClientsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch clients" };
  }
}

// ─── Get Single Client ──────────────────────────────────

export async function getClient(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getClientAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch client" };
  }
}

// ─── Create Client ──────────────────────────────────────

export async function createClient(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createClientAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create client" };
  }
}

// ─── Update Client ──────────────────────────────────────

export async function updateClient(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateClientAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update client" };
  }
}

// ─── Delete Client ──────────────────────────────────────

export async function deleteClient(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteClientAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete client" };
  }
}

// ─── Clients Dropdown ───────────────────────────────────

export async function getClientsDropdown() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getClientsDropdownAPI(token);
    if (res.success) return res.data || [];
    return [];
  } catch {
    return [];
  }
}

// ─── Get Account Managers (for dropdown) ────────────────

export async function getAccountManagers() {
  return getAssignableStaff();
}
