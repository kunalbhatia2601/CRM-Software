"use server";

import {
  getTeamsAPI,
  getTeamAPI,
  createTeamAPI,
  updateTeamAPI,
  deleteTeamAPI,
  getTeamsDropdownAPI,
  addTeamMemberAPI,
  removeTeamMemberAPI,
  updateTeamMemberPermissionsAPI,
  getUsersAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


export async function getTeams(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getTeamsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch teams" };
  }
}

export async function getTeam(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await getTeamAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch team" };
  }
}

export async function createTeam(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await createTeamAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create team" };
  }
}

export async function updateTeam(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateTeamAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update team" };
  }
}

export async function deleteTeam(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await deleteTeamAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete team" };
  }
}

export async function addTeamMember(teamId, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await addTeamMemberAPI(teamId, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to add team member" };
  }
}

export async function removeTeamMember(teamId, userId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await removeTeamMemberAPI(teamId, userId, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to remove team member" };
  }
}

export async function updateTeamMemberPermissions(teamId, userId, permissions) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateTeamMemberPermissionsAPI(teamId, userId, permissions, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Failed to update team member permissions",
    };
  }
}

export async function getTeamsDropdown() {
  const token = await getToken();
  if (!token) return [];
  try {
    const res = await getTeamsDropdownAPI(token);
    if (res.success) return res.data || [];
    return [];
  } catch {
    return [];
  }
}

export async function getTeamMembers() {
  const token = await getToken();
  if (!token) return { success: false, data: [] };
  try {
    const res = await getUsersAPI({ limit: 100 }, token);
    if (res.success) {
      const users = (res.data.users || [])
        .filter((u) => u.role !== "CLIENT" && u.status === "ACTIVE")
        .map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          email: u.email,
          avatar: u.avatar,
        }));
      return { success: true, data: users };
    }
    return { success: false, data: [] };
  } catch {
    return { success: false, data: [] };
  }
}
