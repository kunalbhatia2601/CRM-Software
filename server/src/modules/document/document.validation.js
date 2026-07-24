import { z } from "zod";

const documentTypes = ["PROPOSAL", "AGREEMENT", "NDA", "INVOICE", "CONTRACT", "REPORT", "OTHER"];

export const createDocumentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").max(200),
    type: z.enum(documentTypes).optional().default("PROPOSAL"),
    fileUrl: z.string().min(1, "File URL is required"),
    fileKey: z.string().optional().nullable(),
    mimeType: z.string().optional().nullable(),
    fileSize: z.coerce.number().int().optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    isAiGenerated: z.boolean().optional().default(false),
    dealId: z.string().optional().nullable(),
    clientId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    userId: z.string().optional().nullable(),
  }),
});

export const updateDocumentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    type: z.enum(documentTypes).optional(),
    description: z.string().max(2000).optional().nullable(),
  }),
});

export const listDocumentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    type: z.enum(documentTypes).optional(),
    dealId: z.string().optional(),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
    userId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "name", "type", "version"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getDocumentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const deleteDocumentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const sendDocumentEmailSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    to: z.string().email("Valid email is required"),
    cc: z.string().email().optional().nullable(),
    subject: z.string().min(1).max(200).optional(),
    message: z.string().max(2000).optional().nullable(),
  }),
});
