"use server";

import {
  listHolidaysAPI,
  createHolidayAPI,
  updateHolidayAPI,
  deleteHolidayAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function listHolidays(year) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await listHolidaysAPI(year, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function createHoliday(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createHolidayAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateHoliday(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateHolidayAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteHoliday(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteHolidayAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
