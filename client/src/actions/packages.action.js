"use server";

import {
  getPackagesAPI,
  getPackageAPI,
  createPackageAPI,
  updatePackageAPI,
  deletePackageAPI,
  getPackagesDropdownAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";

// ─── List Packages ────────────────────────────────────────

export async function getPackages(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getPackagesAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch packages" };
  }
}

// ─── Get Single Package ──────────────────────────────────

export async function getPackage(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getPackageAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch package" };
  }
}

// ─── Create Package ───────────────────────────────────────

export async function createPackage(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createPackageAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create package" };
  }
}

// ─── Update Package ───────────────────────────────────────

export async function updatePackage(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updatePackageAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update package" };
  }
}

// ─── Delete Package ───────────────────────────────────────

export async function deletePackage(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deletePackageAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete package" };
  }
}

// ─── Packages Dropdown (Active Only) ─────────────────────

export async function getPackagesDropdown() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getPackagesDropdownAPI(token);
    if (res.success) return res.data || [];
    return [];
  } catch {
    return [];
  }
}
