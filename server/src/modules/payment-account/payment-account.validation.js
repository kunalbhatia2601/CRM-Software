import { z } from "zod";

const types = ["BANK", "UPI"];

const base = {
  type: z.enum(types),
  label: z.string().min(1, "Give this account a label").max(120),

  bankName: z.string().max(200).optional().nullable(),
  accountNumber: z.string().max(60).optional().nullable(),
  ifscCode: z.string().max(20).optional().nullable(),
  accountHolderName: z.string().max(200).optional().nullable(),
  branch: z.string().max(200).optional().nullable(),

  upiId: z.string().max(120).optional().nullable(),
  upiName: z.string().max(200).optional().nullable(),

  /**
   * Starts this account's invoice series. Letters and digits only — it becomes
   * part of a document number, so no spaces, dashes or punctuation.
   */
  invoicePrefix: z
    .string()
    .trim()
    .min(2, "Prefix needs at least 2 characters")
    .max(8, "Prefix can be at most 8 characters")
    .regex(/^[A-Za-z0-9]+$/, "Use letters and numbers only")
    .transform((v) => v.toUpperCase())
    .optional(),

  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
};

/**
 * A bank account needs its bank fields; a UPI account needs its UPI fields.
 * Checked here so an incomplete account can never reach an invoice.
 */
function assertTypeFields(data, ctx) {
  if (data.type === "BANK") {
    for (const [field, label] of [
      ["bankName", "Bank name"],
      ["accountNumber", "Account number"],
      ["ifscCode", "IFSC code"],
      ["accountHolderName", "Account holder name"],
    ]) {
      if (!data[field]?.trim()) {
        ctx.addIssue({ code: "custom", path: [field], message: `${label} is required for a bank account` });
      }
    }
  }
  if (data.type === "UPI") {
    if (!data.upiId?.trim()) {
      ctx.addIssue({ code: "custom", path: ["upiId"], message: "UPI ID is required" });
    }
    if (!data.upiName?.trim()) {
      ctx.addIssue({ code: "custom", path: ["upiName"], message: "Name is required for a UPI account" });
    }
  }
}

export const createAccountSchema = z.object({
  body: z.object(base).superRefine(assertTypeFields),
});

export const updateAccountSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  // Partial edits still have to leave a valid account behind, so the service
  // re-validates the merged record.
  body: z.object(base).partial(),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export const listAccountsSchema = z.object({
  query: z.object({ includeInactive: z.string().optional() }),
});
