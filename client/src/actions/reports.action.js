"use server";

import {
  previewReportAPI, listReportsAPI, generateReportAPI, getReportAPI,
  updateReportAPI, clearReportOverrideAPI, deleteReportAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";

/** Every action returns {success, data|error} — the shape the UI expects. */
async function call(fn, fallback) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await fn(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || fallback };
  }
}

export async function previewReport(params) {
  return call((t) => previewReportAPI(params, t), "Failed to build preview");
}

export async function getReports(params = {}) {
  return call((t) => listReportsAPI(params, t), "Failed to load reports");
}

export async function generateReport(data) {
  return call((t) => generateReportAPI(data, t), "Failed to generate report");
}

export async function getReport(id) {
  return call((t) => getReportAPI(id, t), "Failed to load report");
}

export async function updateReport(id, data) {
  return call((t) => updateReportAPI(id, data, t), "Failed to save report");
}

export async function clearReportOverride(id, path) {
  return call((t) => clearReportOverrideAPI(id, path, t), "Failed to clear override");
}

export async function deleteReport(id) {
  return call((t) => deleteReportAPI(id, t), "Failed to delete report");
}
