"use server";

import {
  getProjectCyclesAPI, getCurrentCycleAPI, startNextCycleAPI, getCarryOverCandidatesAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";

/** Every action returns {success, data|error} — the shape the UI expects. */
async function call(fn, fallback) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not authenticated" };
  try {
    const res = await fn(token);
    if (res.success) return { success: true, data: res.data, message: res.message };
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || fallback };
  }
}

export async function getProjectCycles(projectId) {
  return call((t) => getProjectCyclesAPI(projectId, t), "Failed to load cycles");
}

export async function getCurrentCycle(projectId) {
  return call((t) => getCurrentCycleAPI(projectId, t), "Failed to load the current cycle");
}

export async function startNextCycle(projectId, data) {
  return call((t) => startNextCycleAPI(projectId, data, t), "Failed to start the next cycle");
}

export async function getCarryOverCandidates(cycleId) {
  return call((t) => getCarryOverCandidatesAPI(cycleId, t), "Failed to load unfinished tasks");
}
