import { z } from "zod";

const followUpTypes = ["CALL", "EMAIL", "MEETING", "TASK", "OTHER"];
const followUpStatuses = ["PENDING", "COMPLETED", "SKIPPED", "OVERDUE"];

export const createFollowUpSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    type: z.enum(followUpTypes).optional().default("CALL"),
    status: z.enum(followUpStatuses).optional().default("PENDING"),
    dueAt: z.coerce.date({ required_error: "Due date is required" }),
    notes: z.string().max(5000).optional().nullable(),
    outcome: z.string().max(5000).optional().nullable(),
    // Exactly one of these; the service rejects zero or both.
    leadId: z.string().min(1).optional().nullable(),
    dealId: z.string().min(1).optional().nullable(),
  }),
});

export const updateFollowUpSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(followUpTypes).optional(),
    status: z.enum(followUpStatuses).optional(),
    dueAt: z.coerce.date().optional(),
    notes: z.string().max(5000).optional().nullable(),
    outcome: z.string().max(5000).optional().nullable(),
  }),
});

export const listFollowUpsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    type: z.enum(followUpTypes).optional(),
    status: z.enum(followUpStatuses).optional(),
    leadId: z.string().optional(),
    dealId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "dueAt", "title", "status"]).optional().default("dueAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
  }),
});

export const getFollowUpSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const deleteFollowUpSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
