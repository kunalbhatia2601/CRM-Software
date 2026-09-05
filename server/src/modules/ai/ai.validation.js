import { z } from "zod";

export const generateSchema = z.object({
  body: z.object({
    systemPromptSlug: z.string().min(1, "System prompt slug is required"),
    userPrompt: z.string().min(1, "User prompt is required"),
    context: z.record(z.any()).optional(),
    structured: z.boolean().optional(),
  }),
});

export const searchSchema = z.object({
  body: z.object({
    question: z.string().min(1, "Question is required").max(1000),
  }),
});

/**
 * The settings screen may ask for a catalogue before the key is saved, so the
 * provider details are accepted as an optional override.
 */
export const listModelsSchema = z.object({
  body: z.object({
    provider: z.enum(["GEMINI", "OPENAI", "CUSTOM"]).optional(),
    apiKey: z.string().min(1).optional(),
    baseUrl: z.string().url().optional().or(z.literal("")),
  }).optional().default({}),
});
