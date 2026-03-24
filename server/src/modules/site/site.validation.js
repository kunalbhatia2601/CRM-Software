import { z } from "zod";

export const updateSiteSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Site name is required").max(100).optional(),
    logo: z.string().nullable().optional(),
    contactEmail: z.string().email("Invalid email").nullable().optional(),
    contactPhone: z.string().max(30).nullable().optional(),
    address: z.string().max(500).nullable().optional(),
    currency: z.enum(["INR", "USD", "EUR"]).optional(),
    usdToInr: z.coerce
      .number()
      .min(0.0001, "Rate must be positive")
      .max(999999, "Rate too large")
      .optional(),
    eurToInr: z.coerce
      .number()
      .min(0.0001, "Rate must be positive")
      .max(999999, "Rate too large")
      .optional(),
    isMaintenanceMode: z.boolean().optional(),
    isDemoMode: z.boolean().optional(),
  }),
});
