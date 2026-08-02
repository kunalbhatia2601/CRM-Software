"use server";

import { cookies } from "next/headers";
import {
  getProjectDeliverablesAPI,
  getDeliverableAPI,
  createDeliverableAPI,
  updateDeliverableAPI,
  deleteDeliverableAPI,
  addDeliverableFeedbackAPI,
} from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

export async function getProjectDeliverables(projectId) {
  const token = await getToken();
  if (!token) return { success: false, data: [], error: "Not authenticated" };
  try {
    const res = await getProjectDeliverablesAPI(projectId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) { return { success: false, data: [], error: err.message }; }
}

export async function getDeliverable(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getDeliverableAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function createDeliverable(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createDeliverableAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function updateDeliverable(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateDeliverableAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function deleteDeliverable(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteDeliverableAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}

export async function addDeliverableFeedback(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await addDeliverableFeedbackAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) { return { success: false, error: err.message }; }
}
