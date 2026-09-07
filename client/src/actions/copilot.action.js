"use server";

import {
  getCopilotConversationsAPI,
  getCopilotConversationAPI,
  createCopilotConversationAPI,
  updateCopilotConversationAPI,
  deleteCopilotConversationAPI,
  getCopilotMessagesAPI,
  sendCopilotMessageAPI,
  getCopilotSuggestionsAPI,
  getCopilotCapabilitiesAPI,
  executeCopilotActionAPI,
} from "@/lib/api";
import { getToken } from "@/lib/session";


/* ───────── Conversations ───────── */

export async function getCopilotConversations() {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getCopilotConversationsAPI(token);
    return { success: true, data: Array.isArray(res.data) ? res.data : [] };
  } catch (err) {
    console.error("[copilot.action] getConversations error:", err.message);
    return { success: false, data: [] };
  }
}

export async function getCopilotConversation(id) {
  const token = await getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await getCopilotConversationAPI(id, token);
    return { success: true, data: res.data || res };
  } catch (err) {
    console.error("[copilot.action] getConversation error:", err.message);
    return { success: false, data: null };
  }
}

export async function createCopilotConversation(title = "New Conversation") {
  const token = await getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await createCopilotConversationAPI({ title }, token);
    return { success: true, data: res };
  } catch (err) {
    console.error("[copilot.action] createConversation error:", err.message);
    return { success: false, data: null };
  }
}

export async function updateCopilotConversation(id, data) {
  const token = await getToken();
  if (!token) return { success: false };

  try {
    const res = await updateCopilotConversationAPI(id, data, token);
    return { success: true, data: res };
  } catch (err) {
    console.error("[copilot.action] updateConversation error:", err.message);
    return { success: false };
  }
}

export async function deleteCopilotConversation(id) {
  const token = await getToken();
  if (!token) return { success: false };

  try {
    await deleteCopilotConversationAPI(id, token);
    return { success: true };
  } catch (err) {
    console.error("[copilot.action] deleteConversation error:", err.message);
    return { success: false };
  }
}

/* ───────── Messages ───────── */

export async function getCopilotMessages(conversationId) {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getCopilotMessagesAPI(conversationId, token);
    return { success: true, data: Array.isArray(res) ? res : [] };
  } catch (err) {
    console.error("[copilot.action] getMessages error:", err.message);
    return { success: false, data: [] };
  }
}

export async function sendCopilotMessage(conversationId, content, context = {}, webSearch = false) {
  const token = await getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await sendCopilotMessageAPI({
      conversationId,
      content,
      context,
      webSearch,
    }, token);
    // Server returns {success, message, data: {userMessage, assistantMessage, conversationId}}
    return { success: true, data: res };
  } catch (err) {
    return { success: false, data: null, error: err.message };
  }
}

/* ───────── Capabilities ───────── */

export async function getCopilotCapabilities() {
  const token = await getToken();
  if (!token) return { success: false, data: { webSearch: false, tools: [] } };

  try {
    const res = await getCopilotCapabilitiesAPI(token);
    return { success: true, data: res.data || { webSearch: false, tools: [] } };
  } catch (err) {
    console.error("[copilot.action] getCapabilities error:", err.message);
    // A failed probe hides the toggle rather than offering one that cannot work.
    return { success: false, data: { webSearch: false, tools: [] } };
  }
}

/* ───────── Suggestions ───────── */

export async function getCopilotSuggestions() {
  const token = await getToken();
  if (!token) return { success: false, data: [] };

  try {
    const res = await getCopilotSuggestionsAPI(token);
    return { success: true, data: Array.isArray(res) ? res : [] };
  } catch (err) {
    console.error("[copilot.action] getSuggestions error:", err.message);
    return { success: false, data: [] };
  }
}

/* ───────── Actions ───────── */

/**
 * Confirm one action the assistant proposed.
 *
 * The error text is passed through rather than flattened to a generic failure:
 * it is written for the person reading it ("That invoice has no client email"),
 * and it is the only thing telling them what to fix.
 */
export async function executeCopilotAction(messageId, actionId) {
  const token = await getToken();
  if (!token) return { success: false, error: "Not signed in" };

  try {
    const res = await executeCopilotActionAPI(messageId, actionId, token);
    return { success: true, data: res.data || res, message: res.message || "Done" };
  } catch (err) {
    console.error("[copilot.action] executeAction error:", err.message);
    return { success: false, error: err.message || "Could not run that action" };
  }
}
