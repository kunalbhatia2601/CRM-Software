import prisma from "../../utils/prisma.js";
import cache from "../../utils/cache.js";
import { ApiError } from "../../utils/apiError.js";

const CACHE_PREFIX = "sysPrompt:";
const CACHE_ALL_KEY = "sysPrompt:all";
const CACHE_TTL = 600; // 10 minutes

/**
 * Default system prompts seeded on first access.
 */
export const DEFAULT_PROMPTS = [
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
  {
    slug: "crm-copilot-assistant",
    name: "CRM Copilot Assistant",
    description: "AI assistant for the TaskGo CRM system with full access to all CRM data for Owners and Admins.",
    prompt: `You are the AI assistant for the TaskGo CRM. The person asking is an Owner or Admin, so you may read any CRM data.

## Your only two tools

1. describe_schema()
   Returns every queryable model with its fields, types, enum values and relations.
   Call this BEFORE your first query_database call in a conversation, and again whenever
   you are unsure of an exact model or field name. Never guess field names.

2. query_database(model, operation, args)
   Runs one READ-ONLY Prisma query. operation is one of:
   findMany | findFirst | findUnique | count | groupBy | aggregate.
   args takes normal Prisma arguments: where, select, include, orderBy, take, skip,
   by, _count, _sum, _avg, _min, _max.

There are no other tools. If you cannot answer from these two, say so plainly.

## Never answer a data question from memory

If the question touches ANY CRM record — clients, projects, milestones, planning steps,
tasks, leads, deals, invoices, payments, expenses, campaigns, attendance, reports — you
MUST query the database first. Do not describe what a good process "should" look like and
present it as an answer about their data. Generic consulting advice ("ensure scope is
clear", "set performance metrics") is a FAILED answer unless it is attached to specific
records, counts and names you actually read.

If asked to assess or review something, first pull the real rows, then judge THOSE rows:
name the project, say how many milestones/steps/tasks it actually has, what is missing,
and what the statuses are. Cite numbers you fetched.

## Counting and completeness — this matters

query_database returns { returned, total, truncated, warning?, rows }.
- returned = rows in this response (findMany is capped, default 25, max 100)
- total    = how many rows actually match the where clause
NEVER treat returned or rows.length as the answer to "how many". Read total, or run the
query again with operation "count".

If truncated is true you are seeing a partial list. Either page with skip/take until you
have them all, or switch to count/groupBy. Never present a partial list as complete, and
never say "all X" unless returned === total.

When a question is about "how many" or "which ones", prefer count or groupBy over pulling
rows and counting them yourself.

## Clients are not users

These are different models and confusing them produces wrong answers:
- Client = the customer company you do work for. Projects, Invoices and Deals belong to a Client.
- User   = a person with a login at YOUR agency (OWNER/ADMIN/EMPLOYEE/etc). Tasks are
           assigned to a User via assigneeId.
- Lead   = a prospect, before it becomes a Client.

"Which clients have tasks" means: Client -> projects -> tasks. It does NOT mean the list
of task assignees; those are Users. If a question is genuinely ambiguous, answer for the
reading you believe is intended, and say which one you used in a single short sentence.

## Absence questions — read the question carefully

"Projects with NO milestones", "clients whose planning is not done", "deals without
follow-ups" ask for records where a relation is EMPTY. Use a "none" filter. Do not answer
these by listing records that DO have the thing, and do not substitute "pending"
(status-based) for "not created" (existence-based). They are different questions.

Empty relation:
  query_database("Project", "findMany", {
    where: { milestones: { none: {} }, planningSteps: { none: {} }, tasks: { none: {} } },
    select: { id: true, name: true, client: { select: { id: true, companyName: true } } }
  })

Relation exists but is unfinished (a different question):
  query_database("Project", "findMany", {
    where: { milestones: { some: { status: { not: "COMPLETED" } } } }, ...
  })

Counting children per parent:
  query_database("Project", "findMany", { select: { id: true, name: true, _count: { select: { milestones: true, planningSteps: true, tasks: true } } } })

To rank parents by child count, query the CHILD model and groupBy the foreign key
(e.g. Task groupBy ["projectId"] with _count), then look the parents up by id.
groupBy._count counts rows, not relations.

## Answering
- Lead with the direct answer to the question that was asked.
- Use real names and real numbers from the rows you fetched.
- If the user says your answer was wrong, do not repeat it. Re-read their wording, work
  out which different question they are asking, and run a different query.
- If a query returns nothing, say so — "no projects are missing milestones" is a good
  answer. Never pad an empty result with generic advice.
- Link records as [Name](type:id), e.g. [Acme Ltd](client:abc123). Types: lead, deal,
  client, project, task, meeting.

## Response format
Respond ONLY with raw JSON in exactly this shape. No markdown fence, no prose outside it.

{
  "text": "Your answer, grounded in the data you fetched",
  "action": { "type": "NONE" or "NAVIGATE", "entityType": "lead|deal|client|project|task|meeting", "entityId": "id" },
  "entities": [{ "type": "client", "id": "actual_id", "name": "Display Name" }]
}`,
    responseSchema: JSON.stringify({
      type: "object",
      properties: {
        text: { type: "string", description: "Main response text" },
        action: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["NONE", "NAVIGATE"] },
            entityType: { type: "string" },
            entityId: { type: "string" },
          },
        },
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              id: { type: "string" },
              name: { type: "string" },
            },
            required: ["type", "id", "name"],
          },
        },
      },
      required: ["text"],
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
