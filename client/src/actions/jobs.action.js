"use server";

import { cookies } from "next/headers";
import {
  getJobsAPI, getJobAPI, createJobAPI, updateJobAPI, deleteJobAPI,
  getJobApplicationsAPI, updateJobApplicationAPI,
  getPublicJobsAPI, getPublicJobAPI, applyToJobAPI,
} from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

/* ── HR-managed ── */

export async function getJobs(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getJobsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getJob(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getJobAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function createJob(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createJobAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updateJob(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateJobAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function deleteJob(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteJobAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function getJobApplications(id) {
  const token = await getToken();
  if (!token) return { success: false, data: null, error: "Not authenticated" };
  try {
    const res = await getJobApplicationsAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updateJobApplication(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateJobApplicationAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

/* ── Public (no auth) ── */

export async function getPublicJobs() {
  try {
    const res = await getPublicJobsAPI();
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) { return { success: false, data: [], error: err.message }; }
}

export async function getPublicJob(slug) {
  try {
    const res = await getPublicJobAPI(slug);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function applyToJob(slug, data) {
  try {
    const res = await applyToJobAPI(slug, data);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}
