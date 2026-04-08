import { z } from "zod";

const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "COMPLETED", "REVIEWED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    dueDate: z.string().optional().nullable(),
    planningStepId: z.string().optional().nullable(),
    milestoneId: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    parentTaskId: z.string().optional().nullable(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    position: z.coerce.number().int().min(0).optional(),
    dueDate: z.string().optional().nullable(),
    planningStepId: z.string().optional().nullable(),
    milestoneId: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    // Feedback fields — required when moving to REVIEWED
    feedback: z.string().max(5000).optional(),
    nextStep: z.string().max(2000).optional().nullable(),
  }),
});

export const getTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const deleteTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const bulkUpdateStatusSchema = z.object({
  body: z.object({
    taskIds: z.array(z.string().min(1)).min(1),
    status: z.enum(statuses),
  }),
});

export const addFeedbackSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    feedback: z.string().min(1, "Feedback is required").max(5000),
    nextStep: z.string().max(2000).optional().nullable(),
    statusAfter: z.enum(statuses).optional(),
  }),
});
