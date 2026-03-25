import { z } from "zod";

const statuses = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"];
const sources = [
  "WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "COLD_CALL",
  "EMAIL_CAMPAIGN", "ADVERTISEMENT", "META_AD", "EVENT", "PARTNER", "OTHER",
];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const createLeadSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, "Company name is required").max(200),
    contactName: z.string().min(1, "Contact name is required").max(100),
    email: z.string().email("Invalid email").optional().nullable(),
    phone: z.string().optional().nullable(),
    source: z.enum(sources).optional(),
    priority: z.enum(priorities).optional(),
    estimatedValue: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    followUpAt: z.coerce.date().optional().nullable(),
  }),
});

export const updateLeadSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    companyName: z.string().min(1).max(200).optional(),
    contactName: z.string().min(1).max(100).optional(),
    email: z.string().email("Invalid email").optional().nullable(),
    phone: z.string().optional().nullable(),
    source: z.enum(sources).optional(),
    priority: z.enum(priorities).optional(),
    estimatedValue: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    followUpAt: z.coerce.date().optional().nullable(),
  }),
});

export const updateLeadStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(statuses, { required_error: "Status is required" }),
    lostReason: z.string().max(500).optional().nullable(),
  }),
});

export const listLeadsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    status: z.enum(statuses).optional(),
    source: z.enum(sources).optional(),
    priority: z.enum(priorities).optional(),
    assigneeId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "companyName", "contactName", "status", "priority", "estimatedValue"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getLeadSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
