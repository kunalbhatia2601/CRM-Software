import prisma from "../../utils/prisma.js";
import aiService from "../ai/ai.service.js";
import { ApiError } from "../../utils/apiError.js";
import { copilotTools, runAction, actionToolCatalog } from "./copilot.actions.js";

class CopilotService {
  /** Action ids currently executing, so one button cannot fire twice. */
  #running = new Set();

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
  async sendMessage(userId, content, context = {}, { webSearch = false } = {}) {
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

    // Write actions the model wants to take. Collected, never performed: they
    // are stored on the message and become buttons the user has to press.
    const proposals = [];

    try {
      // Call AI with tool calling — the model decides when to query the CRM.
      const aiResponse = await aiService.generateWithTools({
        systemPromptSlug: "crm-copilot-assistant",
        userPrompt: content,
        history: recentHistory,
        trace,
        extraTools: copilotTools((p) => proposals.push(p)),
        // Per message, from the toggle next to the chat box. The setting in
        // Settings still has to allow it; this only says whether this
        // particular question wants to pay for a lookup.
        webSearch,
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

      // Never store a blank reply. A turn that produced a proposal is not a
      // failure even when the model wrote nothing, so it gets its own line
      // rather than "I couldn't find an answer".
      if (!responseText || !responseText.trim()) {
        responseText = proposals.length
          ? `Ready for you to review below — nothing has been saved yet.`
          : "I couldn't find an answer for that. Try rephrasing your question.";
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

      const traceMeta = this.#traceMeta(trace, startedAt);

      // Store AI response
      const assistantMessage = await prisma.copilotMessage.create({
        data: {
          conversationId,
          role: "assistant",
          content: responseText,
          contextData: {
            action,
            entities,
            ...(proposals.length ? { actions: proposals } : {}),
            ...traceMeta,
          },
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
          actions: proposals,
          trace: traceMeta,
        },
        conversationId,
      };
    } catch (error) {
      console.error("[CopilotService] AI error:", {
        message: error?.message,
        status: error?.status || error?.statusCode,
        stack: error?.stack,
      });

      // A raw driver error (a Prisma validation failure, say) can carry the
      // entire attempted row in its message — hundreds of lines, and useless to
      // a user. Truncated here so the chat shows a message, not a data dump;
      // the full error is already in the server log above.
      const rawErrorText = error?.message || "The AI request failed. Please try again.";
      const errorText =
        rawErrorText.length > 500
          ? rawErrorText.slice(0, 500) + "… (see server logs for the full error)"
          : rawErrorText;

      const traceMeta = this.#traceMeta(trace, startedAt);

      // Persisting the failure must not itself become a second failure. If a
      // tool result carried something the trace couldn't shape safely, the
      // very error that says so would otherwise throw again while being
      // saved — which is how one ordinary error becomes an unreadable
      // nested dump instead of a message the user can read. Falls back, in
      // order, to a version without the trace, then to not persisting at all.
      let assistantMessage;
      try {
        await prisma.copilotMessage.create({
          data: { conversationId, role: "user", content, contextData: context },
        });
        assistantMessage = await prisma.copilotMessage.create({
          data: {
            conversationId,
            role: "assistant",
            content: errorText,
            // A failed turn is exactly when the trace matters most.
            contextData: { isError: true, ...traceMeta },
          },
        });
        await prisma.copilotConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      } catch (persistError) {
        console.error("[CopilotService] Failed to persist error turn, retrying without trace:", persistError.message);
        try {
          assistantMessage = await prisma.copilotMessage.create({
            data: {
              conversationId,
              role: "assistant",
              content: errorText,
              contextData: { isError: true },
            },
          });
        } catch (secondPersistError) {
          console.error("[CopilotService] Could not persist error turn at all:", secondPersistError.message);
        }
      }

      // Return (don't throw) so the client renders it as a normal error bubble,
      // whether or not any of the writes above actually landed.
      return {
        userMessage: { role: "user", content },
        assistantMessage: {
          // Falls back to a client-side id when nothing could be persisted, so
          // the reply still renders instead of throwing on a missing field.
          id: assistantMessage?.id || `err-${Date.now()}`,
          role: "assistant",
          content: errorText,
          action: null,
          entities: [],
          isError: true,
          trace: traceMeta,
        },
        conversationId,
      };
    }
  }

  /**
   * Run one proposed action, after the user pressed its button.
   *
   * This is the only path from the copilot to a write. It re-reads the proposal
   * from the message row rather than trusting anything the client sent, so a
   * crafted request cannot execute a payload the model never proposed, and it
   * records the outcome back onto the message so the button does not come back
   * armed after a refresh.
   */
  async executeAction(user, messageId, actionId) {
    const message = await prisma.copilotMessage.findFirst({
      // The join is the authorisation: a message only resolves inside a
      // conversation this user owns.
      where: { id: messageId, conversation: { userId: user.id } },
      select: { id: true, contextData: true },
    });
    if (!message) throw ApiError.notFound("Message not found");

    const ctx = message.contextData || {};
    const actions = Array.isArray(ctx.actions) ? ctx.actions : [];
    const index = actions.findIndex((a) => a?.id === actionId);
    if (index === -1) throw ApiError.notFound("That suggestion is no longer on this message");

    const proposal = actions[index];
    if (proposal.status === "done") {
      throw ApiError.badRequest("That action has already been run.");
    }

    // Guards a double-click and a double-submit within this process. The stored
    // status covers the reload case. Neither covers two servers racing on the
    // same action — worth revisiting if this ever runs behind more than one.
    if (this.#running.has(actionId)) {
      throw ApiError.badRequest("That action is already running.");
    }
    this.#running.add(actionId);

    try {
      const result = await runAction(proposal, user);

      actions[index] = {
        ...proposal,
        status: "done",
        executedAt: new Date().toISOString(),
        result: { message: result.message, entity: result.entity || null },
      };
      await prisma.copilotMessage.update({
        where: { id: message.id },
        data: { contextData: { ...ctx, actions } },
      });

      return { action: actions[index], message: result.message, entity: result.entity || null };
    } catch (err) {
      // A failure is recorded too — it is the more useful half of the history,
      // and it leaves the button live so the user can fix the cause and retry.
      actions[index] = {
        ...proposal,
        status: "failed",
        failedAt: new Date().toISOString(),
        error: String(err?.message || "Action failed").slice(0, 500),
      };
      await prisma.copilotMessage
        .update({ where: { id: message.id }, data: { contextData: { ...ctx, actions } } })
        .catch(() => {});
      throw err;
    } finally {
      this.#running.delete(actionId);
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
      // Named distinctly from the object it lives on, so nothing here reads as
      // "trace.trace". Kept lean for the chat UI: tool, timing, ok/fail and the
      // one-line summary — not the raw args or result preview, which stay
      // internal-only in the full stored trace.
      calls: trace.slice(0, 40).map((c) => ({
        tool: c.tool,
        model: c.model,
        operation: c.operation,
        ok: c.ok,
        ms: c.ms,
        summary: c.summary || null,
        error: c.error || null,
      })),
      callsTruncated: trace.length > 40,
    };
  }

  /**
   * What this install can currently do, for the chat UI to render against.
   *
   * Web search is OpenAI's hosted tool, so it needs the provider as well as the
   * setting; the toggle should not appear at all when it could not work.
   */
  async getCapabilities() {
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
      select: { aiProvider: true, aiWebSearchEnabled: true },
    });

    const webSearch = !!settings?.aiWebSearchEnabled && settings?.aiProvider === "OPENAI";

    // Every tool the model can be given, whether or not it is switched on right
    // now — a disabled one is still worth showing, with a reason.
    const tools = [
      ...aiService.coreToolCatalog().map((t) => ({ ...t, kind: "read", enabled: true })),
      ...actionToolCatalog().map((t) => ({ ...t, enabled: true })),
      {
        ...aiService.webSearchCatalogEntry(),
        label: "Search the web",
        kind: "search",
        danger: false,
        enabled: webSearch,
        disabledReason: webSearch ? null : "Off — turn on \"Allow live web search\" in AI Settings.",
      },
    ];

    return { webSearch, tools };
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