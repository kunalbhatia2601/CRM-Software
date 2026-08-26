"use server";

import {
  getExpenseCategoriesAPI, createExpenseCategoryAPI, updateExpenseCategoryAPI, deleteExpenseCategoryAPI,
  getExpensesAPI, getMyExpensesAPI, getExpenseAPI, createExpenseAPI, updateExpenseAPI,
  deleteExpenseAPI, approveExpenseAPI, rejectExpenseAPI, payExpenseAPI, cancelExpenseAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";

const noAuth = { success: false, error: "Not authenticated" };

/** Every action returns {success, data|error} — the shape the UI expects. */
async function call(fn, fallback) {
  const token = await getToken();
  if (!token) return noAuth;
  try {
    const res = await fn(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || fallback };
  }
}

// ─── Categories ───

export async function getExpenseCategories(params = {}) {
  return call((t) => getExpenseCategoriesAPI(params, t), "Failed to load categories");
}

export async function createExpenseCategory(data) {
  return call((t) => createExpenseCategoryAPI(data, t), "Failed to create category");
}

export async function updateExpenseCategory(id, data) {
  return call((t) => updateExpenseCategoryAPI(id, data, t), "Failed to update category");
}

export async function deleteExpenseCategory(id) {
  return call((t) => deleteExpenseCategoryAPI(id, t), "Failed to delete category");
}

// ─── Expenses ───

export async function getExpenses(params = {}) {
  return call((t) => getExpensesAPI(params, t), "Failed to load expenses");
}

export async function getMyExpenses(params = {}) {
  return call((t) => getMyExpensesAPI(params, t), "Failed to load expenses");
}

export async function getExpense(id) {
  return call((t) => getExpenseAPI(id, t), "Failed to load expense");
}

export async function createExpense(data) {
  return call((t) => createExpenseAPI(data, t), "Failed to record expense");
}

export async function updateExpense(id, data) {
  return call((t) => updateExpenseAPI(id, data, t), "Failed to update expense");
}

export async function deleteExpense(id) {
  return call((t) => deleteExpenseAPI(id, t), "Failed to delete expense");
}

export async function approveExpense(id, note) {
  return call((t) => approveExpenseAPI(id, { note }, t), "Failed to approve");
}

export async function rejectExpense(id, note) {
  return call((t) => rejectExpenseAPI(id, { note }, t), "Failed to reject");
}

export async function payExpense(id, data) {
  return call((t) => payExpenseAPI(id, data, t), "Failed to mark paid");
}

export async function cancelExpense(id) {
  return call((t) => cancelExpenseAPI(id, t), "Failed to withdraw");
}
