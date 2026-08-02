"use server";

import {
  getKpiConfigAPI, updateKpiConfigAPI,
  generatePayrollAPI, getPayrollAPI, getPayrollRecordAPI,
  previewPayrollAPI, getPayrollHistoryAPI, setUserBasePayAPI, updatePayrollRecordAPI, deletePayrollRecordAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getKpiConfig() {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getKpiConfigAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updateKpiConfig(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateKpiConfigAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function generatePayroll(year, month) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await generatePayrollAPI({ year, month }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getPayroll(year, month) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getPayrollAPI({ year, month }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getPayrollRecord(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getPayrollRecordAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function previewPayroll(userId, year, month) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await previewPayrollAPI(userId, { year, month }, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getPayrollHistory(userId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getPayrollHistoryAPI(userId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function setUserBasePay(userId, basePay) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await setUserBasePayAPI(userId, basePay, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updatePayrollRecord(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updatePayrollRecordAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function deletePayrollRecord(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deletePayrollRecordAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}
