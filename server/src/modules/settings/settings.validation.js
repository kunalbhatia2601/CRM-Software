import { z } from "zod";

const storageProviders = ["LOCAL", "S3", "R2", "CUSTOM"];

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

    // Storage
    storageProvider: z.enum(storageProviders).optional(),
    storageAccessKeyId: z.string().max(500).nullable().optional(),
    storageSecretKey: z.string().max(500).nullable().optional(),
    storageEndpoint: z.string().url("Invalid endpoint URL").max(500).nullable().optional(),
    storageRegion: z.string().max(100).nullable().optional(),
    storageBucket: z.string().max(200).nullable().optional(),
    storagePublicUrl: z.string().url("Invalid public URL").max(500).nullable().optional(),
    storageCustomPostUrl: z.string().url("Invalid POST URL").max(500).nullable().optional(),
    storageCustomFileKey: z.string().max(100).nullable().optional(),
    storageCustomUrlKey: z.string().max(100).nullable().optional(),
  }),
});
