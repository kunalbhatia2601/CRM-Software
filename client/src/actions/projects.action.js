"use server";

import {
  getProjectsAPI,
  getProjectAPI,
  createProjectAPI,
  updateProjectAPI,
  deleteProjectAPI,
  getUsersAPI,
  addProjectServicesAPI,
  updateProjectServiceAPI,
  removeProjectServiceAPI,
  getProjectPermissionsAPI,
  getProjectOptionsAPI,
} from "@/lib/api";
import { getAssignableStaff } from "./users.action";
import { getClientsDropdown } from "./clients.action";
import { getTeamsDropdownAPI } from "@/lib/api";
import { getToken } from "@/lib/session";

// ─── Helpers ─────────────────────────────────────────────


// ─── List Projects ───────────────────────────────────────

export async function getProjects(params = {}) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getProjectsAPI(params, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch projects" };
  }
}

// ─── Get Single Project ─────────────────────────────────

export async function getProject(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await getProjectAPI(id, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to fetch project" };
  }
}

// ─── Create Project ─────────────────────────────────────

export async function createProject(data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await createProjectAPI(data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to create project" };
  }
}

// ─── Update Project ─────────────────────────────────────

export async function updateProject(id, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateProjectAPI(id, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update project" };
  }
}

// ─── Delete Project ─────────────────────────────────────

export async function deleteProject(id) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await deleteProjectAPI(id, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to delete project" };
  }
}

// ─── Get Account Managers ───────────────────────────────

export async function getProjectAccountManagers() {
  return getAssignableStaff();
}

// ─── Get Clients for Project dropdown ───────────────────

export async function getProjectClients() {
  return getClientsDropdown();
}

// ─── Get Teams for Project dropdown ─────────────────────

export async function getProjectTeams() {
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

// ─── Project Services ────────────────────────────────────

export async function addProjectServices(projectId, services) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await addProjectServicesAPI(projectId, services, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to add services" };
  }
}

export async function updateProjectService(projectId, serviceId, data) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await updateProjectServiceAPI(projectId, serviceId, data, token);
    if (res.success) return { success: true, data: res.data };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update service" };
  }
}

export async function removeProjectService(projectId, serviceId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await removeProjectServiceAPI(projectId, serviceId, token);
    if (res.success) return { success: true };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to remove service" };
  }
}

// ─── Project Permissions ────────────────────────────────

/**
 * What the signed-in user may do on this project.
 * Used to decide which buttons and fields to render.
 */
export async function getProjectPermissions(projectId) {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await getProjectPermissionsAPI(projectId, token);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

/**
 * Projects the signed-in user may attribute spend or work to.
 * Employees get their own team's projects; managers and HR get all.
 */
export async function getProjectOptions() {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await getProjectOptionsAPI(token);
    return res.success ? res.data || [] : [];
  } catch {
    return [];
  }
}
