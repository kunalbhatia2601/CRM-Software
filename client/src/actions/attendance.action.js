"use server";

import {
  checkInAPI,
  checkOutAPI,
  getTodayAttendanceAPI,
  getMyAttendanceAPI,
  getDailyAttendanceSheetAPI,
  getUserAttendanceAPI,
  manualMarkAttendanceAPI,
  updateAttendanceAPI,
  deleteAttendanceAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function checkIn(notes) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await checkInAPI({ notes }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function checkOut(notes) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await checkOutAPI({ notes }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getTodayAttendance() {
  const token = await getToken();
  if (!token) return { success: false, data: null };
  try {
    const res = await getTodayAttendanceAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: null, error: res.message };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
}

export async function getMyAttendance(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await getMyAttendanceAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getDailyAttendanceSheet(date) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await getDailyAttendanceSheetAPI(date, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getUserAttendance(userId, params = {}) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await getUserAttendanceAPI(userId, params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function manualMarkAttendance(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await manualMarkAttendanceAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateAttendance(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateAttendanceAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteAttendance(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteAttendanceAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
