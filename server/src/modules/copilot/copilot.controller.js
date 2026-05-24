import copilotService from "./copilot.service.js";
import { ok } from "../../utils/apiResponse.js";

/**
 * Get all conversations for current user
 */
async function getConversations(req, res, next) {
  try {
    const conversations = await copilotService.getConversations(req.user.id);
    return ok(res, "Conversations fetched successfully", conversations);
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single conversation with messages
 */
async function getConversation(req, res, next) {
  try {
    const conversation = await copilotService.getConversation(
      req.params.id,
      req.user.id
    );
    return ok(res, "Conversation fetched successfully", conversation);
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new conversation
 */
async function createConversation(req, res, next) {
  try {
    const conversation = await copilotService.createConversation(
      req.user.id,
      req.body.title
    );
    return ok(res, "Conversation created successfully", conversation);
  } catch (error) {
    next(error);
  }
}

/**
 * Update a conversation (pin/archive)
 */
async function updateConversation(req, res, next) {
  try {
    const conversation = await copilotService.updateConversation(
      req.params.id,
      req.user.id,
      req.body
    );
    return ok(res, "Conversation updated successfully", conversation);
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a conversation
 */
async function deleteConversation(req, res, next) {
  try {
    await copilotService.deleteConversation(req.params.id, req.user.id);
    return ok(res, "Conversation deleted successfully", {success: true});
  } catch (error) {
    next(error);
  }
}

/**
 * Get messages for a conversation
 */
async function getMessages(req, res, next) {
  try {
    const messages = await copilotService.getMessages(
      req.params.conversationId,
      req.user.id
    );
    return ok(res, "Messages fetched successfully", messages);
  } catch (error) {
    next(error);
  }
}

/**
 * Send a message (main chat endpoint)
 */
async function sendMessage(req, res, next) {
  try {
    const context = {
      ...req.body.context,
      userRole: req.user.role,
      conversationId: req.body.conversationId,
    };

    const result = await copilotService.sendMessage(
      req.user.id,
      req.body.content,
      context
    );
    return ok(res, "Message sent successfully", result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get suggested prompts
 */
async function getSuggestions(req, res, next) {
  try {
    const suggestions = copilotService.getSuggestions();
    
    return ok(res, "Suggestions fetched successfully", suggestions);

  } catch (error) {
    next(error);
  }
}

export default {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  getMessages,
  sendMessage,
  getSuggestions,
};