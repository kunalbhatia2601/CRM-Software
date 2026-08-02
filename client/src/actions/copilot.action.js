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

export async function sendCopilotMessage(conversationId, content, context = {}) {
  const token = await getToken();
  if (!token) return { success: false, data: null };

  try {
    const res = await sendCopilotMessageAPI({
      conversationId,
      content,
      context,
    }, token);
    // Server returns {success, message, data: {userMessage, assistantMessage, conversationId}}
    return { success: true, data: res };
  } catch (err) {
    return { success: false, data: null, error: err.message };
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