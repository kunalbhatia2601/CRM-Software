import { z } from "zod";

const statuses = ["IN_PROGRESS", "IN_REVIEW", "CHANGES_REQUESTED", "COMPLETED"];
const feedbackTypes = ["APPROVED", "CHANGES_REQUESTED", "COMMENT"];

const fileSchema = z.object({
  name: z.string().min(1).max(300),
  url: z.string().min(1),
  key: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  size: z.coerce.number().optional().nullable(),
});

const linkSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().min(1).max(2000),
});

export const createDeliverableSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional().nullable(),
    content: z.string().max(20000).optional().nullable(),
    files: z.array(fileSchema).optional().nullable(),
    links: z.array(linkSchema).optional().nullable(),
    status: z.enum(statuses).optional(),
    requiresFeedback: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    milestoneIds: z.array(z.string()).optional(),
    planningStepIds: z.array(z.string()).optional(),
    taskIds: z.array(z.string()).optional(),
  }),
});

export const updateDeliverableSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    content: z.string().max(20000).optional().nullable(),
    files: z.array(fileSchema).optional().nullable(),
    links: z.array(linkSchema).optional().nullable(),
    status: z.enum(statuses).optional(),
    requiresFeedback: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    milestoneIds: z.array(z.string()).optional(),
    planningStepIds: z.array(z.string()).optional(),
    taskIds: z.array(z.string()).optional(),
  }),
});

export const projectParamSchema = z.object({
  params: z.object({ projectId: z.string().min(1) }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const addFeedbackSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    type: z.enum(feedbackTypes).optional().default("COMMENT"),
    message: z.string().max(5000).optional().nullable(),
  }),
});
