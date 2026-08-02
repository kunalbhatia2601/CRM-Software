"use server";

import { globalSearchAPI } from "@/lib/api";
import { getToken } from "@/lib/session";


export async function globalSearch(query) {
  const token = await getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await globalSearchAPI({ q: query, limit: 5 }, token);
    if (res.success) {
      return { success: true, data: res.data };
    }
    return { success: false, data: null };
  } catch {
    return { success: false, data: null };
  }
}
