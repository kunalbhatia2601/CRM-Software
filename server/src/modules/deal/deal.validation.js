import { z } from "zod";

const stages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
const billingCycles = ["ONE_TIME", "MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"];

export const createDealSchema = z.object({
  body: z.object({
    leadId: z.string().min(1, "Lead ID is required"),
    title: z.string().min(1, "Title is required").max(200),
    value: z.coerce.number().min(0).optional().nullable(),
    expectedCloseAt: z.coerce.date().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
  }),
});

export const updateDealSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    value: z.coerce.number().min(0).optional().nullable(),
    expectedCloseAt: z.coerce.date().optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
  }),
});

export const updateDealStageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    stage: z.enum(stages, { required_error: "Stage is required" }),
    lostReason: z.string().max(500).optional().nullable(),
    accountManagerId: z.string().optional().nullable(),
    // Full project configuration for WON conversion
    projectConfig: z.object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional().nullable(),
      budget: z.coerce.number().min(0).optional().nullable(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable(),
      billingCycle: z.enum(billingCycles).optional(),
      nextBillingDate: z.string().optional().nullable(),
      notes: z.string().max(2000).optional().nullable(),
      services: z.array(z.object({
        serviceId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).optional().default(1),
        price: z.coerce.number().min(0),
        originalPrice: z.coerce.number().min(0),
      })).optional(),
    }).optional(),
  }),
});

export const listDealsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    stage: z.enum(stages).optional(),
    assigneeId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "title", "value", "stage", "expectedCloseAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getDealSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const addDealServicesSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    services: z.array(
      z.object({
        serviceId: z.string().min(1, "Service ID is required"),
        quantity: z.coerce.number().int().min(1).optional().default(1),
        price: z.coerce.number().min(0).optional(),
      })
    ).min(1, "At least one service is required"),
  }),
});

export const removeDealServiceSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    serviceId: z.string().min(1),
  }),
});
