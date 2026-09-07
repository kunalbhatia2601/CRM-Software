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
   * Build a short chat title from the first user message.
   */
  #titleFromMessage(content) {
    const text = String(content || "").replace(/\s+/g, " ").trim();
    if (!text) return "New Conversation";
    const words = text.split(" ").slice(0, 8).join(" ");
    const title = words.length > 60 ? words.slice(0, 60).trim() + "…" : words;
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  /**
   * Pull a { text, action, entities } object out of a raw AI reply that may be
   * plain JSON, fenced ```json, or prose mixed with a JSON block.
   */
  #extractStructured(raw) {
    if (!raw) return null;
    const text = String(raw);

    // 1. Fenced ```json ... ``` block.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
    }

    // 2. Whole thing is JSON.
    try {
      const p = JSON.parse(text.trim());
      if (p && typeof p === "object") return p;
    } catch { /* fall through */ }

    // 3. First balanced {...} that parses and has a "text" field.
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        const p = JSON.parse(text.slice(first, last + 1));
        if (p && (p.text || p.answer)) return p;
      } catch { /* ignore */ }
    }
    return null;
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
      // New conversation — title it from the first message.
      conversation = await this.createConversation(userId, this.#titleFromMessage(content));
      conversationId = conversation.id;
    } else if (
      (conversation.title === "New Conversation" || !conversation.title) &&
      (await prisma.copilotMessage.count({ where: { conversationId } })) === 0
    ) {
      // Existing but empty conversation still on the default title — set it now.
      await prisma.copilotConversation.update({
        where: { id: conversationId },
        data: { title: this.#titleFromMessage(content) },
      });
    }

    // Conversation history for the model.
    //
    // Only role and content are selected. contextData holds the tool trace —
    // the queries that ran, their arguments and result previews — which is kept
    // for internal review and must never be fed back to the model: it would
    // burn tokens, and stale query output read as fact is how a wrong answer
    // gets repeated on the next turn.
    const history = await prisma.copilotMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
    });

    // Recent turns are sent as their own messages, not glued onto the question.
    // Twelve is enough for follow-ups ("what about the rest?") without burying
    // the current question — or a correction — in a wall of older text.
    // Rebuilt field by field, so widening the select above can never leak the
    // trace into the prompt by accident.
    const recentHistory = history.slice(-12).map((m) => ({ role: m.role, content: m.content }));

    // Collected per request: which tools ran, with what, and what came back.
    // Kept on the assistant message so a wrong answer can be explained later
    // without having to reproduce it.
    const trace = [];
    const startedAt = Date.now();

    try {
      // Call AI with tool calling — the model decides when to query the CRM.
      const aiResponse = await aiService.generateWithTools({
        systemPromptSlug: "crm-copilot-assistant",
        userPrompt: content,
        history: recentHistory,
        trace,
        // Tool rounds before a final answer is forced. A real question often
        // costs several: describe_schema, find the project, then a query or two
        // per entity being compared. The last round runs without tools, so this
        // is one more than the number of queries the model actually gets.
        maxTurns: 16,
      });

      // Parse AI response
      let responseText = "";
      let action = null;
      let entities = [];

      if (typeof aiResponse === "string") {
        responseText = aiResponse;
      } else if (aiResponse?.error && !aiResponse.text && !aiResponse.answer && !aiResponse.raw) {
        // The provider explained why it produced nothing — hitting the token
        // limit, say. Saying "I couldn't find an answer" would hide a cause the
        // user can actually act on.
        responseText = aiResponse.error;
      } else if (aiResponse && (aiResponse.text || aiResponse.answer)) {
        // Structured JSON result
        responseText = aiResponse.text || aiResponse.answer;
        action = aiResponse.action || null;
        entities = aiResponse.entities || aiResponse.items || [];
      } else if (aiResponse && aiResponse.raw) {
        const parsed = this.#extractStructured(aiResponse.raw);
        if (parsed) {
          responseText = parsed.text || parsed.answer || "";
          action = parsed.action || null;
          entities = parsed.entities || parsed.items || [];
        }
        // If no structured object (or it had no text), fall back to the raw text,
        // but strip any ```json ... ``` block so it never leaks into the chat.
        if (!responseText || !responseText.trim()) {
          responseText = String(aiResponse.raw).replace(/```(?:json)?[\s\S]*?```/g, "").trim();
        }
      }

      // A reply cut off mid-sentence is still worth keeping — with a note, so
      // the user knows to ask for the rest rather than assuming that was all.
      if (responseText?.trim() && aiResponse?.truncated) {
        responseText += "\n\n_This answer was cut off at the token limit. Ask for the next part, or raise Max Tokens in AI settings._";
      }

      // Never store a blank reply.
      if (!responseText || !responseText.trim()) {
        responseText = "I couldn't find an answer for that. Try rephrasing your question.";
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
          contextData: { action, entities, ...this.#traceMeta(trace, startedAt) },
        },
      });

      // Update conversation timestamp
      await prisma.copilotConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Trim the tail so a long-running chat cannot grow without bound.
      await this.pruneOldMessages(conversationId).catch((e) =>
        console.error("[CopilotService] prune failed:", e.message)
      );

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
      console.error("[CopilotService] AI error:", {
        message: error?.message,
        status: error?.status || error?.statusCode,
        stack: error?.stack,
      });

      const errorText = error?.message || "The AI request failed. Please try again.";

      // Persist the exchange so the error stays in the conversation history.
      await prisma.copilotMessage.create({
        data: { conversationId, role: "user", content, contextData: context },
      });
      const assistantMessage = await prisma.copilotMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: errorText,
          // A failed turn is exactly when the trace matters most.
          contextData: { isError: true, ...this.#traceMeta(trace, startedAt) },
        },
      });
      await prisma.copilotConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      // Return (don't throw) so the client renders it as a normal error bubble.
      return {
        userMessage: { role: "user", content },
        assistantMessage: {
          id: assistantMessage.id,
          role: "assistant",
          content: errorText,
          action: null,
          entities: [],
          isError: true,
        },
        conversationId,
      };
    }
  }

  /**
   * Shape the collected tool calls for storage.
   *
   * Capped: a runaway conversation must not put an unbounded blob on every
   * message row. The count is kept separately, so a trimmed trace still reports
   * how many calls really happened.
   */
  #traceMeta(trace, startedAt) {
    return {
      toolCallCount: trace.length,
      totalMs: Date.now() - startedAt,
      toolMs: trace.reduce((sum, c) => sum + (c.ms || 0), 0),
      toolsUsed: [...new Set(trace.map((c) => c.tool))],
      failedCalls: trace.filter((c) => !c.ok).length,
      trace: trace.slice(0, 40),
      traceTruncated: trace.length > 40,
    };
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