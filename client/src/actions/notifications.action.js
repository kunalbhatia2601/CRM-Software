"use server";

import { cookies } from "next/headers";
import {
  getNotificationsAPI,
  getUnreadCountAPI,
  markNotificationReadAPI,
  markAllNotificationsReadAPI,
  deleteNotificationAPI,
  clearReadNotificationsAPI,
} from "@/lib/api";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

export async function getNotifications(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await getNotificationsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getUnreadCount() {
  const token = await getToken();
  if (!token) return { success: false, data: { unreadCount: 0 } };

  try {
    const res = await getUnreadCountAPI(token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, data: { unreadCount: 0 } };
  } catch {
    return { success: false, data: { unreadCount: 0 } };
  }
}

export async function markNotificationRead(id) {
  const token = await getToken();
  if (!token) return { success: false };

  try {
    const res = await markNotificationReadAPI(id, token);
    return { success: res.success };
  } catch {
    return { success: false };
  }
}

export async function markAllNotificationsRead() {
  const token = await getToken();
  if (!token) return { success: false };

  try {
    const res = await markAllNotificationsReadAPI(token);
    return { success: res.success };
  } catch {
    return { success: false };
  }
}

export async function deleteNotification(id) {
  const token = await getToken();
  if (!token) return { success: false };

  try {
    const res = await deleteNotificationAPI(id, token);
    return { success: res.success };
  } catch {
    return { success: false };
  }
}

export async function clearReadNotifications() {
  const token = await getToken();
  if (!token) return { success: false };

  try {
    const res = await clearReadNotificationsAPI(token);
    return { success: res.success, data: res.data };
  } catch {
    return { success: false };
  }
}
