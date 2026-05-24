import prisma from "../../utils/prisma.js";
import aiService from "../ai/ai.service.js";
import { ApiError } from "../../utils/apiError.js";

class CopilotService {
  /**
   * Get all conversations for a user
   */
  async getConversations(userId) {
    return prisma.copilotConversation.findMany({
      where: { userId },
      orderBy: [
        { isPinned: "desc" },
        { updatedAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        isPinned: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId, userId) {
    const conversation = await prisma.copilotConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            contextData: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    return conversation;
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId, title = "New Conversation") {
    return prisma.copilotConversation.create({
      data: {
        userId,
        title,
      },
    });
  }

  /**
   * Update a conversation (pin/archive)
   */
  async updateConversation(conversationId, userId, data) {
    const conversation = await prisma.copilotConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    return prisma.copilotConversation.update({
      where: { id: conversationId },
      data,
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId, userId) {
    const conversation = await prisma.copilotConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    // Delete all messages first, then the conversation
    await prisma.copilotMessage.deleteMany({
      where: { conversationId },
    });

    return prisma.copilotConversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId, userId) {
    const conversation = await prisma.copilotConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    return prisma.copilotMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        contextData: true,
        createdAt: true,
      },
    });
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(userId, content, context = {}) {
    // Get or create conversation
    let conversationId = context.conversationId;
    let conversation;

    if (conversationId) {
      conversation = await prisma.copilotConversation.findFirst({
        where: { id: conversationId, userId },
      });
    }

    if (!conversation) {
      // Create a new conversation
      conversation = await this.createConversation(userId, "New Conversation");
      conversationId = conversation.id;
    }

    // Get conversation history (for context)
    const history = await prisma.copilotMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
    });

    // Build context for AI
    const aiContext = {
      user: {
        id: userId,
        role: context.userRole,
      },
      page: context.page,
      entityType: context.entityType,
      entityId: context.entityId,
      timestamp: new Date().toISOString(),
    };

    // Build conversation history for AI (keep last 50 messages)
    const recentHistory = history.slice(-50);
    const historyText = recentHistory.length > 0
      ? "\n\nPrevious conversation:\n" + recentHistory
          .map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n")
      : "";

    // Prepare user prompt with history
    const userPrompt = content + historyText;

    try {
      // Call AI service with structured output
      const aiResponse = await aiService.generate({
        systemPromptSlug: "crm-copilot-assistant",
        userPrompt,
        context: aiContext,
        structured: true, // Request structured JSON response
      });

      // Parse AI response
      let responseText = "";
      let action = null;
      let entities = [];

      if (typeof aiResponse === "string") {
        // Raw text response - use as-is
        responseText = aiResponse;
      } else if (aiResponse.raw) {
        // Try to parse JSON from raw response (might be wrapped in ```json ```)
        try {
          const cleaned = aiResponse.raw.replace(/```json\n?/g, "").replace(/```\n?$/g, "").trim();
          const parsed = JSON.parse(cleaned);
          responseText = parsed.text || parsed.answer || cleaned;
          action = parsed.action || null;
          entities = parsed.entities || parsed.items || [];
        } catch {
          responseText = aiResponse.raw;
        }
      } else if (aiResponse.text || aiResponse.answer) {
        responseText = aiResponse.text || aiResponse.answer;
        action = aiResponse.action || null;
        entities = aiResponse.entities || aiResponse.items || [];
      }

      // Store user message
      await prisma.copilotMessage.create({
        data: {
          conversationId,
          role: "user",
          content,
          contextData: context,
        },
      });

      // Store AI response
      const assistantMessage = await prisma.copilotMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: responseText,
          contextData: { action, entities },
        },
      });

      // Update conversation timestamp
      await prisma.copilotConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return {
        userMessage: { role: "user", content },
        assistantMessage: {
          id: assistantMessage.id,
          role: "assistant",
          content: responseText,
          action,
          entities,
        },
        conversationId,
      };
    } catch (error) {
      console.error("[CopilotService] AI error:", error);

      // Store user message even if AI fails
      await prisma.copilotMessage.create({
        data: {
          conversationId,
          role: "user",
          content,
          contextData: context,
        },
      });

      throw ApiError.badRequest(error.message || "Failed to get AI response");
    }
  }

  /**
   * Get suggested prompts based on user's role
   */
  getSuggestions() {
    return [
      "Show me all leads from this week",
      "What's our current deal pipeline?",
      "Create a task for follow up",
      "Summarize the ABC project status",
      "Show team attendance for today",
      "List all active clients",
      "Generate a proposal for XYZ deal",
      "What's pending in my tasks?",
    ];
  }

  /**
   * Prune old messages (keep last 50 per conversation)
   * Can be called periodically or after each message
   */
  async pruneOldMessages(conversationId) {
    const messages = await prisma.copilotMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (messages.length > 50) {
      const toDelete = messages.slice(0, messages.length - 50);
      await prisma.copilotMessage.deleteMany({
        where: {
          id: { in: toDelete.map(m => m.id) },
        },
      });
    }
  }
}

export default new CopilotService();