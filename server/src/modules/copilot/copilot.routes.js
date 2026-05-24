import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import copilotController from "./copilot.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  sendMessageSchema,
  createConversationSchema,
  updateConversationSchema,
  idParamSchema,
} from "./copilot.validation.js";

const router = Router();

// All copilot routes require OWNER or ADMIN
router.use(authenticate, authorize("OWNER", "ADMIN"));

// GET /api/copilot/suggestions - Get suggested prompts (no validation needed)
router.get("/suggestions", copilotController.getSuggestions);

// GET /api/copilot/conversations - List all conversations
router.get("/conversations", copilotController.getConversations);

// POST /api/copilot/conversations - Create new conversation
router.post(
  "/conversations",
  validate(createConversationSchema),
  copilotController.createConversation
);

// GET /api/copilot/conversations/:id - Get single conversation with messages
router.get(
  "/conversations/:id",
  validate(idParamSchema),
  copilotController.getConversation
);

// PATCH /api/copilot/conversations/:id - Update conversation (pin/archive)
router.patch(
  "/conversations/:id",
  validate(idParamSchema),
  validate(updateConversationSchema),
  copilotController.updateConversation
);

// DELETE /api/copilot/conversations/:id - Delete conversation
router.delete(
  "/conversations/:id",
  validate(idParamSchema),
  copilotController.deleteConversation
);

// GET /api/copilot/messages/:conversationId - Get messages for a conversation
router.get(
  "/messages/:conversationId",
  copilotController.getMessages
);

// POST /api/copilot/message - Send message (main chat endpoint)
router.post(
  "/message",
  validate(sendMessageSchema),
  copilotController.sendMessage
);

export default router;