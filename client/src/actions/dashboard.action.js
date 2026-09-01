"use server";

import { cookies } from "next/headers";
import { getDashboardStatsAPI, getClientDashboardStatsAPI, getEmployeeDashboardStatsAPI, getSalesDashboardStatsAPI, getAccountDashboardStatsAPI, getHrDashboardStatsAPI, getFinanceDashboardStatsAPI } from "@/lib/api";

/**
 * Fetches dashboard statistics from the backend.
 * @param {string} period – "all" | "year" | "today" | "month"
 */
export async function getDashboardStats(period = "month") {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const res = await getDashboardStatsAPI(accessToken, period);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches CLIENT portal dashboard statistics.
 */
export async function getClientDashboardStats() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const res = await getClientDashboardStatsAPI(accessToken);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches EMPLOYEE portal dashboard statistics.
 */
export async function getEmployeeDashboardStats() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const res = await getEmployeeDashboardStatsAPI(accessToken);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches SALES_MANAGER portal dashboard statistics.
 */
export async function getSalesDashboardStats() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const res = await getSalesDashboardStatsAPI(accessToken);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches ACCOUNT_MANAGER portal dashboard statistics.
 */
export async function getAccountDashboardStats() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const res = await getAccountDashboardStatsAPI(accessToken);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches HR/OWNER/ADMIN attendance-focused dashboard statistics.
 */
export async function getHrDashboardStats() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  try {
    const res = await getHrDashboardStatsAPI(accessToken);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches the FINANCE_MANAGER billing dashboard statistics.
 */
/**
 * @param {object} params { preset: "all"|"month"|"year"|"custom", from?, to? }
 */
export async function getFinanceDashboardStats(params = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) return null;

  try {
    const res = await getFinanceDashboardStatsAPI(accessToken, params);
    if (res.success) return res.data;
    return null;
  } catch {
    return null;
  }
}
