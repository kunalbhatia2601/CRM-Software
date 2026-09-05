import { z } from "zod";

const id = z.string().min(1);

/** Reports only make sense for months that have already begun. */
const year = z.coerce.number().int().min(2020).max(2100);
const month = z.coerce.number().int().min(1).max(12);

export const generateSchema = z.object({
  body: z.object({
    projectId: id,
    year,
    month,
    refresh: z.boolean().optional(),
  }),
});

export const listSchema = z.object({
  query: z.object({
    projectId: id.optional(),
    year: year.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id }),
});

export const updateSchema = z.object({
  params: z.object({ id }),
  body: z.object({
    /// Keyed by "section.field" path — free-form because sections differ in shape.
    overrides: z.record(z.string(), z.any()).optional(),
    summary: z.string().max(20000).optional().nullable(),
    status: z.enum(["DRAFT", "FINAL"]).optional(),
  }),
});

export const clearOverrideSchema = z.object({
  params: z.object({ id }),
  body: z.object({ path: z.string().min(1).max(200) }),
});

export const previewSchema = z.object({
  query: z.object({ projectId: id, year, month }),
});
