import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import cache from "../../utils/cache.js";
import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import systemPromptService from "../system-prompt/system-prompt.service.js";
import searchService from "../search/search.service.js";

/**
 * AI Service — unified interface for Gemini, OpenAI, and Custom providers.
 * Uses official SDKs: @google/genai for Gemini, openai for OpenAI.
 * Custom provider uses raw fetch (OpenAI-compatible format).
 */
class AiService {
  /** @type {GoogleGenAI|null} */ #geminiClient = null;
  /** @type {OpenAI|null} */      #openaiClient = null;

  // Cache SDK clients so we don't re-instantiate on every call.
  // Invalidated when API key or base URL changes.
  #geminiKey = null;
  #openaiKey = null;
  #openaiBaseUrl = null;

  /**
   * Tool definitions for CRM Copilot.
   * Each tool corresponds to a function the AI can call.
   */
  #tools = [
    {
      name: "global_search",
      description: "Search the CRM database for leads, deals, clients, projects, teams, users, and services. BE VERY SPECIFIC with your query for best results. Examples: 'leads', 'recent leads', 'active clients', 'negotiation deals', 'Kunal Bhatia', 'ABC Corp', 'completed projects', 'high priority leads'.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "SPECIFIC search query. Use entity names, statuses, or keywords. E.g., 'leads' (all leads), 'active clients', 'Kunal' (person name), 'ABC Corp' (company name)"
          },
          limit: {
            type: "integer",
            description: "Maximum results per category (default: 10, max: 20)",
            default: 10
          }
        },
        required: ["query"]
      }
    },
    {
      name: "get_overall_stats",
      description: "Get overall statistics/counts for the CRM. Use this when user asks for general stats like 'how many leads', 'total deals', 'active projects count', etc.",
      parameters: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "get_lead_details",
      description: "Get detailed information about a specific lead by ID. Use this when user wants to see full details of a lead.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The lead ID"
          }
        },
        required: ["id"]
      }
    },
    {
      name: "get_deal_details",
      description: "Get detailed information about a specific deal by ID. Use this when user wants to see full details of a deal including value and stage.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The deal ID"
          }
        },
        required: ["id"]
      }
    },
    {
      name: "get_client_details",
      description: "Get detailed information about a specific client by ID. Use this when user wants to see full details of a client.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The client ID"
          }
        },
        required: ["id"]
      }
    },
    {
      name: "get_project_details",
      description: "Get detailed information about a specific project by ID. Use this when user wants to see full details of a project.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The project ID"
          }
        },
        required: ["id"]
      }
    }
  ];

  /**
   * Get raw AI settings from cache or DB.
   */
  async #getAiConfig() {
    return cache.get("settings:raw", async () => {
      let settings = await prisma.settings.findUnique({ where: { id: "default" } });
      if (!settings) settings = await prisma.settings.create({ data: { id: "default" } });
      return settings;
    }, 600);
  }

  /**
   * Get or create a cached GoogleGenAI client.
   */
  #getGeminiClient(apiKey) {
    if (!this.#geminiClient || this.#geminiKey !== apiKey) {
      this.#geminiClient = new GoogleGenAI({ apiKey });
      this.#geminiKey = apiKey;
    }
    return this.#geminiClient;
  }

  /**
   * Get or create a cached OpenAI client.
   */
  #getOpenAIClient(apiKey, baseURL) {
    if (!this.#openaiClient || this.#openaiKey !== apiKey || this.#openaiBaseUrl !== baseURL) {
      this.#openaiClient = new OpenAI({
        apiKey,
        ...(baseURL && { baseURL }),
      });
      this.#openaiKey = apiKey;
      this.#openaiBaseUrl = baseURL;
    }
    return this.#openaiClient;
  }

  /**
   * Main generate function — calls the configured AI provider.
   *
   * @param {Object} opts
   * @param {string}  opts.systemPromptSlug  — Slug of the system prompt to use
   * @param {string}  opts.userPrompt        — The user's input/question
   * @param {Object}  [opts.context]         — Additional context data (merged into prompt)
   * @param {boolean} [opts.structured]       — Whether to request structured JSON output (default: true)
   * @param {boolean} [opts.enableTools]      — Whether to enable tool calling (default: false)
   * @returns {Promise<Object>} Parsed JSON response or raw text
   */
  async generate({ systemPromptSlug, userPrompt, context = {}, structured = true, enableTools = false }) {
    const config = await this.#getAiConfig();

    if (!config.aiProvider || config.aiProvider === "NONE") {
      throw ApiError.badRequest("AI is not configured. Please set up an AI provider in Settings.");
    }
    if (!config.aiApiKey) {
      throw ApiError.badRequest("AI API key is missing. Please configure it in Settings.");
    }

    // Get system prompt
    const sysPrompt = await systemPromptService.getPromptBySlug(systemPromptSlug);
    if (!sysPrompt.isActive) {
      throw ApiError.badRequest(`System prompt "${systemPromptSlug}" is disabled.`);
    }

    // Build the full system message
    let systemMessage = sysPrompt.prompt;

    // Append context if provided (but not if tools are enabled - tools handle context)
    if (Object.keys(context).length > 0 && !enableTools) {
      systemMessage += "\n\n## Provided Context\n```json\n" + JSON.stringify(context, null, 2) + "\n```";
    }

    // Parse response schema if structured output is requested
    let responseSchema = null;
    if (structured && sysPrompt.responseSchema) {
      try {
        responseSchema = JSON.parse(sysPrompt.responseSchema);
      } catch {
        console.warn("[AiService] Failed to parse response schema for", systemPromptSlug);
      }
    }

    // Route to the correct provider
    const provider = config.aiProvider.toUpperCase();
    let result;

    if (provider === "GEMINI") {
      result = await this.#callGemini(config, systemMessage, userPrompt, responseSchema, enableTools);
    } else if (provider === "OPENAI") {
      result = await this.#callOpenAI(config, systemMessage, userPrompt, responseSchema, enableTools);
    } else if (provider === "CUSTOM") {
      result = await this.#callCustom(config, systemMessage, userPrompt, responseSchema, enableTools);
    } else {
      throw ApiError.badRequest(`Unknown AI provider: ${config.aiProvider}`);
    }

    return result;
  }

  /**
   * Generate with tool calling support.
   * AI can call tools up to maxTurns times.
   */
  async generateWithTools({ systemPromptSlug, userPrompt, maxTurns = 2 }) {
    const config = await this.#getAiConfig();

    if (!config.aiProvider || config.aiProvider === "NONE") {
      throw ApiError.badRequest("AI is not configured. Please set up an AI provider in Settings.");
    }
    if (!config.aiApiKey) {
      throw ApiError.badRequest("AI API key is missing. Please configure it in Settings.");
    }

    // Get system prompt
    const sysPrompt = await systemPromptService.getPromptBySlug(systemPromptSlug);
    if (!sysPrompt.isActive) {
      throw ApiError.badRequest(`System prompt "${systemPromptSlug}" is disabled.`);
    }

    const systemMessage = sysPrompt.prompt;

    // Route to the correct provider
    const provider = config.aiProvider.toUpperCase();

    if (provider === "GEMINI") {
      return this.#callGeminiWithTools(config, systemMessage, userPrompt, maxTurns);
    } else if (provider === "OPENAI") {
      return this.#callOpenAIWithTools(config, systemMessage, userPrompt, maxTurns);
    } else if (provider === "CUSTOM") {
      return this.#callCustomWithTools(config, systemMessage, userPrompt, maxTurns);
    } else {
      throw ApiError.badRequest(`Unknown AI provider: ${config.aiProvider}`);
    }
  }

  /**
   * Convenience: CRM Search Assistant — searches the DB then asks AI to interpret results.
   */
  async searchAndAnswer(question) {
    // Step 1: Search the CRM
    const searchResults = await searchService.globalSearch(question, 10);

    // Step 2: Ask AI to interpret
    const result = await this.generate({
      systemPromptSlug: "crm-search-assistant",
      userPrompt: question,
      context: {
        searchResults: {
          users: searchResults.users,
          leads: searchResults.leads,
          deals: searchResults.deals,
          clients: searchResults.clients,
          projects: searchResults.projects,
          teams: searchResults.teams,
          services: searchResults.services,
          counts: searchResults.counts,
        },
      },
      structured: true,
    });

    return result;
  }

  // ─── Provider Implementations ────────────────────────

  /**
   * Google Gemini via @google/genai SDK.
   */
  async #callGemini(config, systemMessage, userPrompt, responseSchema) {
    const model = config.aiModel || "gemini-2.0-flash";

    try {
      const ai = this.#getGeminiClient(config.aiApiKey);

      // Build generation config
      const generationConfig = {
        temperature: config.aiTemperature ?? 0.7,
        maxOutputTokens: config.aiMaxTokens ?? 4096,
      };

      // Add structured output (JSON mode) if schema is provided
      if (responseSchema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = responseSchema;
      }

      const response = await ai.models.generateContent({
        model,
        contents: `${systemMessage}\n\n---\n\nUser Request:\n${userPrompt}`,
        config: generationConfig,
      });

      const text = response.text || "";

      // Parse structured JSON or return raw
      if (responseSchema) {
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }

      return { raw: text };
    } catch (error) {
      console.error("[AiService:Gemini] Error:", error.message);
      throw ApiError.badRequest(error.message || "Gemini API call failed");
    }
  }

  /**
   * OpenAI via official openai SDK.
   */
  async #callOpenAI(config, systemMessage, userPrompt, responseSchema) {
    const model = config.aiModel || "gpt-4o-mini";
    const baseURL = config.aiBaseUrl || undefined; // SDK defaults to https://api.openai.com/v1

    try {
      const client = this.#getOpenAIClient(config.aiApiKey, baseURL);

      const requestBody = {
        model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userPrompt },
        ],
        temperature: config.aiTemperature ?? 0.7,
        max_tokens: config.aiMaxTokens ?? 4096,
      };

      // Add structured output format if schema is provided
      if (responseSchema) {
        requestBody.response_format = {
          type: "json_schema",
          json_schema: {
            name: "structured_response",
            strict: false,
            schema: responseSchema,
          },
        };
      }

      const completion = await client.chat.completions.create(requestBody);

      const text = completion.choices?.[0]?.message?.content || "";

      // Parse structured JSON or return raw
      if (responseSchema) {
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }

      return { raw: text };
    } catch (error) {
      console.error("[AiService:OpenAI] Error:", error.message);
      throw ApiError.badRequest(error.message || "OpenAI API call failed");
    }
  }

  /**
   * Custom OpenAI-compatible provider via raw fetch.
   * Stays as fetch since custom endpoints may not be fully SDK-compatible.
   */
  async #callCustom(config, systemMessage, userPrompt, responseSchema) {
    if (!config.aiBaseUrl) {
      throw ApiError.badRequest("Custom AI provider requires a Base URL in Settings.");
    }

    const model = config.aiModel || "default";

    const body = {
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt },
      ],
      temperature: config.aiTemperature ?? 0.7,
      max_tokens: config.aiMaxTokens ?? 4096,
    };

    if (responseSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "structured_response",
          strict: false,
          schema: responseSchema,
        },
      };
    }

    const res = await fetch(`${config.aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[AiService:Custom] Error:", JSON.stringify(data));
      throw ApiError.badRequest(data.error?.message || "Custom AI API call failed");
    }

    const text = data.choices?.[0]?.message?.content || "";

    if (responseSchema) {
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    }

    return { raw: text };
  }

  // ─── Tool Execution ─────────────────────────────────────

  /**
   * Execute a tool by name with given arguments.
   */
  async #executeTool(toolName, args = {}) {
    switch (toolName) {
      case "global_search":
        return await searchService.globalSearch(args.query || "", args.limit || 10);

      case "get_overall_stats":
        return await this.#getOverallStats();

      case "get_lead_details":
        return await prisma.lead.findUnique({
          where: { id: args.id },
          include: { assignee: true, createdBy: true }
        });

      case "get_deal_details":
        return await prisma.deal.findUnique({
          where: { id: args.id },
          include: { lead: true, assignee: true }
        });

      case "get_client_details":
        return await prisma.client.findUnique({
          where: { id: args.id },
          include: { accountManager: true }
        });

      case "get_project_details":
        return await prisma.project.findUnique({
          where: { id: args.id },
          include: { client: true, accountManager: true }
        });

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Get overall CRM statistics.
   */
  async #getOverallStats() {
    const [leadCount, dealCount, clientCount, projectCount, userCount, teamCount] = await Promise.all([
      prisma.lead.count(),
      prisma.deal.count(),
      prisma.client.count(),
      prisma.project.count(),
      prisma.user.count({ where: { role: { not: "CLIENT" } } }),
      prisma.team.count(),
    ]);

    // Count by status
    const [leadByStatus, dealByStage, projectByStatus] = await Promise.all([
      prisma.lead.groupBy({ by: ["status"], _count: true }),
      prisma.deal.groupBy({ by: ["stage"], _count: true }),
      prisma.project.groupBy({ by: ["status"], _count: true }),
    ]);

    return {
      counts: { leadCount, dealCount, clientCount, projectCount, userCount, teamCount },
      leadByStatus: leadByStatus.map(s => ({ status: s.status, count: s._count })),
      dealByStage: dealByStage.map(s => ({ stage: s.stage, count: s._count })),
      projectByStatus: projectByStatus.map(s => ({ status: s.status, count: s._count })),
    };
  }

  // ─── Tool-Calling Implementations ─────────────────────

  /**
   * Gemini with tool calling (via function calling).
   */
  async #callGeminiWithTools(config, systemMessage, userPrompt, maxTurns = 2) {
    const model = config.aiModel || "gemini-2.0-flash";

    try {
      const ai = this.#getGeminiClient(config.aiApiKey);

      // Convert tools to Gemini function declarations
      const tools = this.#tools.map(tool => ({
        functionDeclarations: [{
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }]
      }));

      let messages = [
        { role: "user", parts: [{ text: `${systemMessage}\n\n---\n\nUser Request:\n${userPrompt}` }] }
      ];

      let turns = 0;

      while (turns < maxTurns) {
        const response = await ai.models.generateContent({
          model,
          contents: messages,
          config: {
            temperature: config.aiTemperature ?? 0.7,
            maxOutputTokens: config.aiMaxTokens ?? 4096,
            tools,
          },
        });

        // Check if model wants to call a function
        const functionCalls = response.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
          turns++;

          // Execute each tool call
          const toolResults = [];
          for (const call of functionCalls) {
            try {
              const result = await this.#executeTool(call.name, call.args);
              toolResults.push({
                name: call.name,
                result
              });
            } catch (error) {
              toolResults.push({
                name: call.name,
                error: error.message
              });
            }
          }

          // Add function responses to messages
          for (const toolResult of toolResults) {
            messages.push({
              role: "model",
              parts: [{
                functionResponse: {
                  name: toolResult.name,
                  response: toolResult.result
                }
              }]
            });
          }
        } else {
          // No function calls, return the response
          const text = response.text || "";
          try {
            return JSON.parse(text);
          } catch {
            return { raw: text };
          }
        }
      }

      // Max turns reached, return last response
      return { error: "Max tool call iterations reached" };
    } catch (error) {
      console.error("[AiService:GeminiTools] Error:", error.message);
      throw ApiError.badRequest(error.message || "Gemini tool calling failed");
    }
  }

  /**
   * OpenAI with tool calling (function calling).
   */
  async #callOpenAIWithTools(config, systemMessage, userPrompt, maxTurns = 2) {
    const model = config.aiModel || "gpt-4o-mini";
    const baseURL = config.aiBaseUrl || undefined;

    try {
      const client = this.#getOpenAIClient(config.aiApiKey, baseURL);

      // Convert tools to OpenAI format
      const tools = this.#tools;

      let messages = [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
      ];

      let turns = 0;

      while (turns < maxTurns) {
        const completion = await client.chat.completions.create({
          model,
          messages,
          tools,
          tool_choice: "auto",
          temperature: config.aiTemperature ?? 0.7,
          max_tokens: config.aiMaxTokens ?? 4096,
        });

        const choice = completion.choices[0];
        const finishReason = choice.finish_reason;

        // Add assistant message
        messages.push(choice.message);

        // Check if model wants to call a function
        if (finishReason === "tool_calls" && choice.message.tool_calls) {
          turns++;

          // Execute each tool call
          for (const toolCall of choice.message.tool_calls) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const result = await this.#executeTool(toolCall.function.name, args);
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
              });
            } catch (error) {
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: error.message })
              });
            }
          }
        } else {
          // No tool calls, return the response
          const text = choice.message.content || "";
          try {
            return JSON.parse(text);
          } catch {
            return { raw: text };
          }
        }
      }

      // Max turns reached
      return { error: "Max tool call iterations reached" };
    } catch (error) {
      console.error("[AiService:OpenAITools] Error:", error.message);
      throw ApiError.badRequest(error.message || "OpenAI tool calling failed");
    }
  }

  /**
   * Custom provider with tool calling.
   * Uses OpenAI-compatible function calling format.
   */
  async #callCustomWithTools(config, systemMessage, userPrompt, maxTurns = 2) {
    if (!config.aiBaseUrl) {
      throw ApiError.badRequest("Custom AI provider requires a Base URL in Settings.");
    }

    const model = config.aiModel || "default";

    // Convert tools to OpenAI-compatible format
    const tools = this.#tools;

    let messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: userPrompt }
    ];

    let turns = 0;

    while (turns < maxTurns) {
      const body = {
        model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: config.aiTemperature ?? 0.7,
        max_tokens: config.aiMaxTokens ?? 4096,
      };

      const res = await fetch(`${config.aiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.aiApiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[AiService:CustomTools] Error:", JSON.stringify(data));
        throw ApiError.badRequest(data.error?.message || "Custom AI tool calling failed");
      }

      const choice = data.choices[0];
      const finishReason = choice.finish_reason;

      // Add assistant message
      messages.push(choice.message);

      // Check if model wants to call a function
      if (finishReason === "tool_calls" && choice.message.tool_calls) {
        turns++;

        // Execute each tool call
        for (const toolCall of choice.message.tool_calls) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await this.#executeTool(toolCall.function.name, args);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            });
          } catch (error) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: error.message })
            });
          }
        }
      } else {
        // No tool calls, return the response
        const text = choice.message.content || "";
        try {
          return JSON.parse(text);
        } catch {
          return { raw: text };
        }
      }
    }

    // Max turns reached
    return { error: "Max tool call iterations reached" };
  }
}

export default new AiService();
