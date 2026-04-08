import { z } from "zod";

const entityTypes = ["TASK", "MILESTONE", "PLANNING_STEP"];

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, "Comment content is required").max(5000),
    entityType: z.enum(entityTypes),
    entityId: z.string().min(1, "Entity ID is required"),
  }),
});

export const getCommentsSchema = z.object({
  params: z.object({
    entityType: z.enum(entityTypes),
    entityId: z.string().min(1),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
