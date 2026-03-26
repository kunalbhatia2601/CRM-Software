"use server";

import { cookies } from "next/headers";
import {
  getServicesAPI,
  getServiceAPI,
  createServiceAPI,
  updateServiceAPI,
  deleteServiceAPI,
  getServicesDropdownAPI,
} from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

// ─── List Services ───────────────────────────────────────

export async function getServices(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getServicesAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch services" };
  }
}

// ─── Get Single Service ─────────────────────────────────

export async function getService(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getServiceAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch service" };
  }
}

// ─── Create Service ─────────────────────────────────────

export async function createService(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createServiceAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create service" };
  }
}

// ─── Update Service ─────────────────────────────────────

export async function updateService(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateServiceAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update service" };
  }
}

// ─── Delete Service ─────────────────────────────────────

export async function deleteService(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteServiceAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete service" };
  }
}

// ─── Services Dropdown (Active Only) ────────────────────

export async function getServicesDropdown() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getServicesDropdownAPI(token);
    if (res.success) return res.data || [];
    return [];
  } catch {
    return [];
  }
}
