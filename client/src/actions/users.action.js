"use server";

import { cookies } from "next/headers";
import {
  getUsersAPI,
  getUserAPI,
  getUserReportAPI,
  createUserAPI,
  updateUserAPI,
  deleteUserAPI,
  resetPasswordAPI,
} from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

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
