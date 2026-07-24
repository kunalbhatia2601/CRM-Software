import { z } from "zod";

const audiences = ["ALL", "EMPLOYEES", "MANAGERS", "HR"];

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    body: z.string().min(1, "Body is required").max(5000),
    audience: z.enum(audiences).optional().default("ALL"),
    isPinned: z.boolean().optional(),
  }),
});

export const listAnnouncementsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
