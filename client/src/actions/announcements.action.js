"use server";

import {
  getAnnouncementsAPI,
  createAnnouncementAPI,
  deleteAnnouncementAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getAnnouncements(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getAnnouncementsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch announcements" };
  }
}

export async function createAnnouncement(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createAnnouncementAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to post announcement" };
  }
}

export async function deleteAnnouncement(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteAnnouncementAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete announcement" };
  }
}
