import { z } from "zod";

const statuses = ["DRAFT", "PENDING", "APPROVED", "REJECTED", "PAID", "CANCELLED"];
const paymentModes = ["CASH", "BANK_TRANSFER", "UPI", "CARD", "COMPANY_CARD", "OTHER"];
const fieldTypes = ["text", "textarea", "number", "select", "date", "file"];

// Receipts are photos or PDFs — 5 MB each, at most 10 per claim.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 10;

const attachmentSchema = z.object({
  name: z.string().min(1).max(300),
  url: z.string().min(1),
  key: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  size: z.coerce
    .number()
    .max(MAX_FILE_BYTES, "Each file must be 5 MB or smaller")
    .optional()
    .nullable(),
});

const attachmentsSchema = z
  .array(attachmentSchema)
  .max(MAX_FILES, `At most ${MAX_FILES} files`)
  .optional()
  .nullable();

// One field in a category's claim form.
const fieldDefSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(200),
  type: z.enum(fieldTypes),
  required: z.boolean().optional(),
  options: z.array(z.string().max(200)).optional(),
  placeholder: z.string().max(200).optional(),
  // Rate-driven amount, e.g. mileage × ₹12/km
  computed: z
    .object({ rate: z.coerce.number().min(0), into: z.literal("amount") })
    .optional()
    .nullable(),
});

// ─── Categories ────────────────────────────────────────

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(120),
    description: z.string().max(1000).optional().nullable(),
    icon: z.string().max(60).optional().nullable(),
    fieldSchema: z.array(fieldDefSchema).optional().nullable(),
    requiresReceipt: z.boolean().optional(),
    isReimbursable: z.boolean().optional(),
    approvalLimit: z.coerce.number().min(0).optional().nullable(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: createCategorySchema.shape.body.partial(),
});

// ─── Expenses ──────────────────────────────────────────

const expenseBody = {
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  formData: z.record(z.string(), z.any()).optional().nullable(),
  attachments: attachmentsSchema,
  amount: z.coerce.number().min(0, "Amount cannot be negative"),
  taxAmount: z.coerce.number().min(0).optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
  isReimbursable: z.boolean().optional(),
  paymentMode: z.enum(paymentModes).optional().nullable(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  isBillable: z.boolean().optional(),
  // DRAFT keeps it editable; anything else submits it straight away.
  status: z.enum(["DRAFT", "PENDING"]).optional(),
};

export const createExpenseSchema = z.object({ body: z.object(expenseBody) });

export const updateExpenseSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object(expenseBody).partial(),
});

export const listExpensesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(statuses).optional(),
    categoryId: z.string().optional(),
    projectId: z.string().optional(),
    userId: z.string().optional(),
    isBillable: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export const reviewSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ note: z.string().max(2000).optional().nullable() }),
});

export const rejectSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ note: z.string().min(1, "A reason is required to reject").max(2000) }),
});

export const paySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    paymentMode: z.enum(paymentModes).optional().nullable(),
    paymentRef: z.string().max(200).optional().nullable(),
    paidAt: z.string().optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
  }),
});
