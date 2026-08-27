"use server";

import {
  getPaymentAccountsAPI, createPaymentAccountAPI,
  updatePaymentAccountAPI, deletePaymentAccountAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";

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

/** Active accounts by default; pass includeInactive for the settings screen. */
export async function getPaymentAccounts(params = {}) {
  return call((t) => getPaymentAccountsAPI(params, t), "Failed to load payment accounts");
}

export async function createPaymentAccount(data) {
  return call((t) => createPaymentAccountAPI(data, t), "Failed to create account");
}

export async function updatePaymentAccount(id, data) {
  return call((t) => updatePaymentAccountAPI(id, data, t), "Failed to update account");
}

export async function deletePaymentAccount(id) {
  return call((t) => deletePaymentAccountAPI(id, t), "Failed to delete account");
}
