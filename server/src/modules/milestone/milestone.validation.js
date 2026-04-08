import { z } from "zod";

const statuses = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export const createMilestoneSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(statuses).optional(),
    dueDate: z.string().optional().nullable(),
  }),
});

export const updateMilestoneSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(statuses).optional(),
    position: z.coerce.number().int().min(0).optional(),
    dueDate: z.string().optional().nullable(),
  }),
});

export const getMilestoneSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const deleteMilestoneSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const reorderMilestonesSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
  body: z.object({
    milestoneIds: z.array(z.string().min(1)).min(1),
  }),
});
