import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.object({
    conversationId: z.string().nullable().optional(),
    content: z.string().min(1, "Message cannot be empty"),
    context: z.any().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const createConversationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateConversationSchema = z.object({
  body: z.object({
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string(),
  }),
});