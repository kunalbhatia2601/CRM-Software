"use server";

import {
  getSystemPromptsAPI,
  getSystemPromptAPI,
  createSystemPromptAPI,
  updateSystemPromptAPI,
  deleteSystemPromptAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getSystemPrompts() {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getSystemPromptsAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getSystemPrompt(id) {
  const token = await getToken();
  if (!token) return { success: false };

  try {
    const res = await getSystemPromptAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createSystemPrompt(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createSystemPromptAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateSystemPrompt(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateSystemPromptAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteSystemPrompt(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteSystemPromptAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
