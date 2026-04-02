import { z } from "zod";

const linkSchema = z.object({
  label: z.string().min(1, "Link label is required").max(200),
  url: z.string().min(1, "Link URL is required").max(2000),
});

export const createSampleSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Sample name is required").max(200),
    description: z.string().max(2000).optional().nullable(),
    links: z.array(linkSchema).min(1, "At least one link is required"),
  }),
});

export const updateSampleSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    links: z.array(linkSchema).min(1).optional(),
  }),
});

export const listSamplesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "name"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getSampleSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

// Attach/detach samples to leads or deals
export const attachSampleSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    sampleIds: z.array(z.string().min(1)).min(1, "At least one sample ID is required"),
  }),
});

export const detachSampleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    sampleId: z.string().min(1),
  }),
});
