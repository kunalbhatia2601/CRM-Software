"use server";

import {
  getInvoicesAPI,
  getInvoiceAPI,
  getInvoicesByProjectAPI,
  getMyInvoicesAPI,
  createInvoiceAPI,
  updateInvoiceAPI,
  deleteInvoiceAPI,
  getInvoiceConfigAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getInvoices(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getInvoicesAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch invoices" };
  }
}

export async function getInvoice(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getInvoiceAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch invoice" };
  }
}

export async function getInvoicesByProject(projectId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getInvoicesByProjectAPI(projectId, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch project invoices" };
  }
}

export async function createInvoice(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createInvoiceAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create invoice" };
  }
}

export async function updateInvoice(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateInvoiceAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update invoice" };
  }
}

export async function getInvoiceConfig() {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getInvoiceConfigAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch invoice config" };
  }
}

export async function deleteInvoice(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteInvoiceAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete invoice" };
  }
}

export async function getMyInvoices() {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getMyInvoicesAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch invoices" };
  }
}
