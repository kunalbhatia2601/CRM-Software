"use server";

import {
  getDocumentsAPI,
  getDocumentAPI,
  getDocumentsByDealAPI,
  getDocumentsByProjectAPI,
  getDocumentsByUserAPI,
  createDocumentAPI,
  updateDocumentAPI,
  deleteDocumentAPI,
  sendDocumentEmailAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getDocuments(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getDocumentsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getDocument(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getDocumentAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getDocumentsByDeal(dealId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getDocumentsByDealAPI(dealId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getDocumentsByProject(projectId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getDocumentsByProjectAPI(projectId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function getDocumentsByUser(userId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getDocumentsByUserAPI(userId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: [], error: res.message };
  } catch (err) {
    return { success: false, data: [], error: err.message };
  }
}

export async function createDocument(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createDocumentAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateDocument(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateDocumentAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteDocument(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteDocumentAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function sendDocumentEmail(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await sendDocumentEmailAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
