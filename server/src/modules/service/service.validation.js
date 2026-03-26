import { z } from "zod";

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Service name is required").max(200),
    description: z.string().max(5000).optional().nullable(),
    price: z.coerce.number().min(0, "Price must be non-negative"),
    salePrice: z.coerce.number().min(0).optional().nullable(),
    points: z.array(z.string().max(500)).max(20).optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    price: z.coerce.number().min(0).optional(),
    salePrice: z.coerce.number().min(0).optional().nullable(),
    points: z.array(z.string().max(500)).max(20).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const listServicesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["createdAt", "name", "price"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getServiceSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
