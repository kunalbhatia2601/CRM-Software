import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    // SMTP
    smtpHost: z.string().max(255).nullable().optional(),
    smtpPort: z.coerce.number().int().min(1).max(65535).nullable().optional(),
    smtpEmail: z.string().email("Invalid SMTP email").nullable().optional(),
    smtpPassword: z.string().max(255).nullable().optional(),
    smtpIsSecure: z.boolean().optional(),

    // OTP Login
    otpLoginEnabled: z.boolean().optional(),
    otpDigits: z.coerce.number().int().min(4).max(8).optional(),
    otpExpiryMins: z.coerce.number().int().min(1).max(30).optional(),

    // Meta Ads
    metaAppId: z.string().max(255).nullable().optional(),
    metaAppSecret: z.string().max(255).nullable().optional(),
    metaAccessToken: z.string().nullable().optional(),
    metaAdAccountId: z.string().max(255).nullable().optional(),
    metaPageId: z.string().max(255).nullable().optional(),
    metaWebhookVerifyToken: z.string().max(255).nullable().optional(),
  }),
});
