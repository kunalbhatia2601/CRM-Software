import prisma from "../../utils/prisma.js";
import cache from "../../utils/cache.js";
import { ApiError } from "../../utils/apiError.js";

const CACHE_PREFIX = "sysPrompt:";
const CACHE_ALL_KEY = "sysPrompt:all";
const CACHE_TTL = 600; // 10 minutes

/**
 * Default system prompts seeded on first access.
 */
const DEFAULT_PROMPTS = [
  {
    slug: "proposal-generator",
    name: "Proposal Generator",
    description: "Generates professional client proposals based on project details, services, and pricing.",
    prompt: `You are a professional proposal writer for a digital agency. Generate a comprehensive, persuasive client proposal based on the provided details.

## Context
You will receive project information including: client name, project name, services, budget, timeline, and any special requirements.

## Instructions
1. Write a professional proposal with clear sections
2. Include an executive summary, scope of work, deliverables, timeline, pricing breakdown, and terms
3. Use persuasive but professional language
4. Tailor the tone to match the industry of the client
5. Include relevant value propositions and differentiators
6. Make the pricing section clear and itemized

## Important
- Be specific, not generic
- Use concrete timelines and milestones
- Highlight ROI and business impact
- Keep it concise but thorough`,
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string", description: "Proposal title" },
        executiveSummary: { type: "string", description: "Executive summary paragraph" },
        scopeOfWork: {
          type: "array",
          items: {
            type: "object",
            properties: {
              phase: { type: "string" },
              description: { type: "string" },
              deliverables: { type: "array", items: { type: "string" } },
            },
            required: ["phase", "description", "deliverables"],
          },
        },
        timeline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              milestone: { type: "string" },
              duration: { type: "string" },
              description: { type: "string" },
            },
            required: ["milestone", "duration"],
          },
        },
        pricing: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  description: { type: "string" },
                  amount: { type: "string" },
                },
                required: ["item", "amount"],
              },
            },
            total: { type: "string" },
            paymentTerms: { type: "string" },
          },
          required: ["items", "total"],
        },
        terms: { type: "array", items: { type: "string" }, description: "Terms and conditions" },
        conclusion: { type: "string", description: "Closing paragraph" },
      },
      required: ["title", "executiveSummary", "scopeOfWork", "timeline", "pricing", "conclusion"],
    }),
  },
  {
    slug: "agreement-generator",
    name: "Agreement / NDA Generator",
    description: "Generates professional agreements, NDAs, and legal documents for client onboarding and project initiation.",
    prompt: `You are a professional legal document writer for a digital agency. Generate a comprehensive, legally sound document based on the provided details.

## Context
You will receive: document type (Agreement or NDA), agency name, client company name, client contact name, project name, services involved, project value/budget, and any special instructions.

## Instructions
1. Generate a professional document appropriate for the specified type
2. For AGREEMENT: include parties, scope of work, payment terms, deliverables, timelines, confidentiality, termination, governing law, and signature blocks
3. For NDA: include parties, definition of confidential information, obligations, exclusions, term, remedies, and signature blocks
4. Use clear, professional legal language — avoid overly complex legalese
5. Include placeholder dates and signature lines
6. Tailor to the specific services and project details provided

## Important
- Be specific to the project and services provided
- Include clear definitions of terms
- Add reasonable and fair terms for both parties
- Include proper signature blocks with date lines
- Format with clear headings and numbered clauses`,
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        title: { type: "string", description: "Document title, e.g. 'Service Agreement' or 'Non-Disclosure Agreement'" },
        content: { type: "string", description: "The full document content in markdown format with headings, numbered clauses, and signature blocks" },
        summary: { type: "string", description: "A brief 1-2 sentence summary of the document" },
      },
      required: ["title", "content", "summary"],
    }),
  },
  {
    slug: "crm-search-assistant",
    name: "CRM Search Assistant",
    description: "AI assistant that can search the CRM database and provide intelligent answers about leads, deals, clients, projects, teams, and services.",
    prompt: `You are an intelligent CRM assistant for an agency management platform called TaskGo Agency Suite. You help the owner find and understand information about their business.

## Capabilities
You have access to search results from the CRM database containing: Users, Leads, Deals, Clients, Projects, Teams, and Services.

## Instructions
1. Analyze the search results provided to answer the user's question
2. If the search results are relevant, provide a clear, concise answer referencing specific items
3. If no results are found, suggest what the user might search for or how to refine their question
4. Present data in a structured, easy-to-read format
5. When listing items, include relevant details (status, assigned person, value, etc.)
6. Be proactive — if you notice patterns or important insights, mention them
7. Provide actionable suggestions when appropriate

## Tone
- Professional but friendly
- Direct and concise
- Data-driven

## Important
- Only reference data that appears in the provided search results
- Do not fabricate or assume data that isn't provided
- If the question can't be answered from the results, say so clearly`,
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        answer: { type: "string", description: "The main answer to the user's question" },
        items: {
          type: "array",
          description: "Relevant items from search results, if any",
          items: {
            type: "object",
            properties: {
              type: { type: "string", description: "Category: user, lead, deal, client, project, team, service" },
              name: { type: "string" },
              detail: { type: "string" },
              link: { type: "string", description: "Relative URL to the item" },
            },
            required: ["type", "name"],
          },
        },
        suggestions: {
          type: "array",
          description: "Follow-up suggestions or actions",
          items: { type: "string" },
        },
      },
      required: ["answer"],
    }),
  },
];

class SystemPromptService {
  /**
   * Seed default prompts if they don't exist.
   */
  async seedDefaults() {
    for (const p of DEFAULT_PROMPTS) {
      const existing = await prisma.systemPrompt.findUnique({ where: { slug: p.slug } });
      if (!existing) {
        await prisma.systemPrompt.create({ data: p });
      }
    }
    cache.delByPrefix(CACHE_PREFIX);
  }

  /**
   * List all prompts (auto-seeds if empty).
   */
  async listPrompts() {
    const count = await prisma.systemPrompt.count();
    if (count === 0) await this.seedDefaults();

    return cache.get(CACHE_ALL_KEY, async () => {
      return prisma.systemPrompt.findMany({
        orderBy: { createdAt: "asc" },
      });
    }, CACHE_TTL);
  }

  /**
   * Get a prompt by ID.
   */
  async getPrompt(id) {
    const prompt = await prisma.systemPrompt.findUnique({ where: { id } });
    if (!prompt) throw ApiError.notFound("System prompt not found");
    return prompt;
  }

  /**
   * Get a prompt by slug (used internally by AI service).
   * Cached for fast access.
   */
  async getPromptBySlug(slug) {
    return cache.get(`${CACHE_PREFIX}${slug}`, async () => {
      let prompt = await prisma.systemPrompt.findUnique({ where: { slug } });
      if (!prompt) {
        await this.seedDefaults();
        prompt = await prisma.systemPrompt.findUnique({ where: { slug } });
      }
      if (!prompt) throw ApiError.notFound(`System prompt "${slug}" not found`);
      return prompt;
    }, CACHE_TTL);
  }

  /**
   * Create a new prompt.
   */
  async createPrompt(data) {
    const existing = await prisma.systemPrompt.findUnique({ where: { slug: data.slug } });
    if (existing) throw ApiError.conflict("A prompt with this slug already exists");

    const prompt = await prisma.systemPrompt.create({ data });
    cache.del(CACHE_ALL_KEY);
    return prompt;
  }

  /**
   * Update a prompt.
   */
  async updatePrompt(id, data) {
    const existing = await prisma.systemPrompt.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System prompt not found");

    // If slug is changing, check uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const conflict = await prisma.systemPrompt.findUnique({ where: { slug: data.slug } });
      if (conflict) throw ApiError.conflict("A prompt with this slug already exists");
    }

    const updated = await prisma.systemPrompt.update({ where: { id }, data });
    cache.del(`${CACHE_PREFIX}${existing.slug}`);
    if (data.slug) cache.del(`${CACHE_PREFIX}${data.slug}`);
    cache.del(CACHE_ALL_KEY);
    return updated;
  }

  /**
   * Delete a prompt.
   */
  async deletePrompt(id) {
    const existing = await prisma.systemPrompt.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System prompt not found");

    await prisma.systemPrompt.delete({ where: { id } });
    cache.del(`${CACHE_PREFIX}${existing.slug}`);
    cache.del(CACHE_ALL_KEY);
    return { deleted: true };
  }
}

export default new SystemPromptService();
