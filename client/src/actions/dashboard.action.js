"use server";

import { cookies } from "next/headers";
import { getDashboardStatsAPI } from "@/lib/api";

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
