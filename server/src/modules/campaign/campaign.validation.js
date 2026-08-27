import { z } from "zod";

const platforms = ["META", "GOOGLE_ADS", "LINKEDIN", "YOUTUBE", "INSTAGRAM", "EMAIL", "SEO", "OTHER"];
const objectives = ["LEAD_GENERATION", "BRAND_AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "APP_INSTALLS"];
const statuses = ["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];
const metricTypes = ["count", "currency", "percent", "duration"];

/** Stats may be backdated this far, and never into the future. */
export const BACKDATE_DAYS = 30;

const metricDefSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(200),
  type: z.enum(metricTypes),
  unit: z.string().max(30).optional().nullable(),
  required: z.boolean().optional(),
});

const derivedDefSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(200),
  formula: z.string().min(1).max(500),
  format: z.enum(["percent", "currency", "number"]).optional(),
});

// ─── Campaign types ────────────────────────────────────

export const createTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120),
    platform: z.enum(platforms),
    icon: z.string().max(60).optional().nullable(),
    metricSchema: z.array(metricDefSchema).min(1, "At least one metric is required"),
    derivedMetrics: z.array(derivedDefSchema).optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
  }),
});

export const updateTypeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createTypeSchema.shape.body.partial(),
});

// ─── Campaigns ─────────────────────────────────────────

const campaignBody = {
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  typeId: z.string().min(1, "Campaign type is required"),
  objective: z.enum(objectives).optional(),
  status: z.enum(statuses).optional(),
  projectId: z.string().min(1, "Every campaign belongs to a project"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional().nullable(),
  budgetAllocated: z.coerce.number().min(0).optional(),
  dailyCap: z.coerce.number().min(0).optional().nullable(),
  overspendThreshold: z.coerce.number().min(0).max(100).optional().nullable(),
  minCplTarget: z.coerce.number().min(0).optional().nullable(),
  managerId: z.string().optional().nullable(),
};

export const createCampaignSchema = z.object({ body: z.object(campaignBody) });

export const updateCampaignSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object(campaignBody).partial(),
});

export const listCampaignsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(statuses).optional(),
    typeId: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    managerId: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

// ─── Daily stats ───────────────────────────────────────

export const upsertStatSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    date: z.string().min(1, "Date is required"),
    metrics: z.record(z.string(), z.any()).optional().nullable(),
    spend: z.coerce.number().min(0).optional(),
    note: z.string().max(2000).optional().nullable(),
  }),
});

export const listStatsSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const statDateParamSchema = z.object({
  params: z.object({ id: z.string().min(1), date: z.string().min(1) }),
});

// ─── Ad budget ────────────────────────────────────────

const fundSources = ["CLIENT_PAID", "AGENCY_ALLOTTED"];

export const ledgerQuerySchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2200).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

export const addBudgetEntrySchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  body: z.object({
    source: z.enum(fundSources),
    amount: z.coerce.number().positive("Amount must be more than zero"),
    taxAmount: z.coerce.number().min(0).optional(),
    note: z.string().max(2000).optional().nullable(),
    reference: z.string().max(200).optional().nullable(),
    periodYear: z.coerce.number().int().min(2000).max(2200).optional(),
    periodMonth: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

export const entryIdParamSchema = z.object({
  params: z.object({ entryId: z.string().min(1) }),
});

export const overviewQuerySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2200).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  }),
});

// ─── Analytics ────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  query: z.object({
    projectId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

export const projectAnalyticsSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});
