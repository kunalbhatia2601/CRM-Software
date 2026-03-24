import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    smtpHost: z.string().max(255).nullable().optional(),
    smtpPort: z.coerce.number().int().min(1).max(65535).nullable().optional(),
    smtpEmail: z.string().email("Invalid SMTP email").nullable().optional(),
    smtpPassword: z.string().max(255).nullable().optional(),
    smtpIsSecure: z.boolean().optional(),
  }),
});
