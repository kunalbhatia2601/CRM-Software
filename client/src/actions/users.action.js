"use server";

import {
  getUsersAPI,
  getUserAPI,
  getUserReportAPI,
  createUserAPI,
  updateUserAPI,
  deleteUserAPI,
  resetPasswordAPI,
  getClientsDropdownAPI,
  getUserDirectoryAPI,
  getAssignableStaffAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";

// ─── Helpers ─────────────────────────────────────────────


// ─── List Users ──────────────────────────────────────────

export async function getUsers(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getUsersAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch users" };
  }
}

// ─── Get Single User ─────────────────────────────────────

export async function getUser(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getUserAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch user" };
  }
}

// ─── Get User Report ─────────────────────────────────────

export async function getUserReport(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getUserReportAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch user report" };
  }
}

// ─── Create User ─────────────────────────────────────────

export async function createUser(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createUserAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create user" };
  }
}

// ─── Update User ─────────────────────────────────────────

export async function updateUser(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateUserAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update user" };
  }
}

// ─── Delete User ─────────────────────────────────────────

export async function deleteUser(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteUserAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete user" };
  }
}

// ─── Reset Password ──────────────────────────────────────

export async function resetUserPassword(id, newPassword) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await resetPasswordAPI(id, newPassword, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to reset password" };
  }
}

// ─── Get Clients for Dropdown ────────────────────────────

export async function getClientsDropdown() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getClientsDropdownAPI(token);
    if (res.success) return res.data;
    return [];
  } catch {
    return [];
  }
}

// ─── User Directory (HR/OWNER/ADMIN) ─────────────────────

export async function getUserDirectory() {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getUserDirectoryAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

// ─── Assignable Staff ────────────────────────────────────

/**
 * Everyone who can own a lead / deal / project — all active internal users,
 * clients excluded. Readable by every internal role, unlike getUsers().
 *
 * @returns {Promise<Array<{id, name, role, email}>>}
 */
export async function getAssignableStaff() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getAssignableStaffAPI(token);
    if (!res.success) return [];
    return (res.data || []).map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      email: u.email,
    }));
  } catch {
    return [];
  }
}
