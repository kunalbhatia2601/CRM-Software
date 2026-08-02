"use server";

import {
  listLeaveTypesAPI,
  createLeaveTypeAPI,
  updateLeaveTypeAPI,
  deleteLeaveTypeAPI,
  getMyLeaveBalancesAPI,
  getUserLeaveBalancesAPI,
  updateLeaveBalanceAPI,
  seedLeaveBalancesAPI,
  createLeaveRequestAPI,
  getMyLeaveRequestsAPI,
  listLeaveRequestsAPI,
  getLeaveRequestAPI,
  approveLeaveRequestAPI,
  rejectLeaveRequestAPI,
  cancelLeaveRequestAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


// ── Types ──
export async function listLeaveTypes() {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await listLeaveTypesAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function createLeaveType(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createLeaveTypeAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateLeaveType(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateLeaveTypeAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteLeaveType(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteLeaveTypeAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Balances ──
export async function getMyLeaveBalances(year) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await getMyLeaveBalancesAPI(year, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getUserLeaveBalances(userId, year) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await getUserLeaveBalancesAPI(userId, year, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function updateLeaveBalance(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateLeaveBalanceAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function seedLeaveBalances(year) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await seedLeaveBalancesAPI(year, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Requests ──
export async function createLeaveRequest(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createLeaveRequestAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getMyLeaveRequests() {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await getMyLeaveRequestsAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function listLeaveRequests(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await listLeaveRequestsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getLeaveRequest(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getLeaveRequestAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function approveLeaveRequest(id, reviewNotes) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await approveLeaveRequestAPI(id, { reviewNotes }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function rejectLeaveRequest(id, reviewNotes) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await rejectLeaveRequestAPI(id, { reviewNotes }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function cancelLeaveRequest(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await cancelLeaveRequestAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
