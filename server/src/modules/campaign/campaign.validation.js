import { z } from "zod";

export const listCampaignsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(25),
    after: z.string().optional(),
    status: z
      .enum(["ACTIVE", "PAUSED", "ARCHIVED", "DELETED"])
      .optional(),
    datePreset: z
      .enum([
        "today", "yesterday", "this_week_sun_today", "last_7d",
        "last_14d", "last_30d", "last_90d", "this_month", "last_month",
      ])
      .optional()
      .default("last_30d"),
  }),
});

export const getCampaignSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const campaignInsightsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({
    datePreset: z
      .enum([
        "today", "yesterday", "this_week_sun_today", "last_7d",
        "last_14d", "last_30d", "last_90d", "this_month", "last_month",
      ])
      .optional()
      .default("last_30d"),
  }),
});

export const updateCampaignStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"], {
      required_error: "Status is required",
    }),
  }),
});

export const getLeadFormDataSchema = z.object({
  params: z.object({
    formId: z.string().min(1),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    after: z.string().optional(),
  }),
});

export const overviewSchema = z.object({
  query: z.object({
    datePreset: z
      .enum([
        "today", "yesterday", "this_week_sun_today", "last_7d",
        "last_14d", "last_30d", "last_90d", "this_month", "last_month",
      ])
      .optional()
      .default("last_30d"),
  }),
});
