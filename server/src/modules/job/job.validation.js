import { z } from "zod";

const statuses = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"];
const types = ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT", "FREELANCE"];
const workModes = ["ON_SITE", "REMOTE", "HYBRID"];
const fieldTypes = ["text", "textarea", "email", "phone", "number", "select", "file"];

const formFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  type: z.enum(fieldTypes),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().max(200).optional(),
});

export const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    department: z.string().max(120).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    type: z.enum(types).optional(),
    workMode: z.enum(workModes).optional(),
    description: z.string().min(1, "Description is required").max(20000),
    salaryRange: z.string().max(120).optional().nullable(),
    status: z.enum(statuses).optional(),
    formFields: z.array(formFieldSchema).optional().nullable(),
  }),
});

export const updateJobSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    department: z.string().max(120).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    type: z.enum(types).optional(),
    workMode: z.enum(workModes).optional(),
    description: z.string().min(1).max(20000).optional(),
    salaryRange: z.string().max(120).optional().nullable(),
    status: z.enum(statuses).optional(),
    formFields: z.array(formFieldSchema).optional().nullable(),
  }),
});

export const listJobsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: z.enum(statuses).optional(),
    search: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const slugParamSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

// Public application submit — answers are free-form (validated against form on client).
export const applySchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({
    fullName: z.string().min(1, "Name is required").max(200),
    email: z.string().email("Valid email required").max(200),
    phone: z.string().max(40).optional().nullable(),
    answers: z.record(z.any()).optional().nullable(),
  }),
});

export const updateApplicationSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "REJECTED", "HIRED"]).optional(),
    notes: z.string().max(5000).optional().nullable(),
  }),
});
