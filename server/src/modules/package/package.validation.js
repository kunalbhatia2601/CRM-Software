import { z } from "zod";

const itemSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  // Omitted/null = use the service's own price. Set = override just for this package.
  priceOverride: z.coerce.number().min(0).optional().nullable(),
});

export const createPackageSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Package name is required").max(200),
    description: z.string().max(5000).optional().nullable(),
    isActive: z.boolean().optional().default(true),
    items: z.array(itemSchema).min(1, "A package needs at least one service"),
  }),
});

export const updatePackageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    isActive: z.boolean().optional(),
    items: z.array(itemSchema).min(1, "A package needs at least one service").optional(),
  }),
});

export const listPackagesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    sortBy: z.enum(["createdAt", "name"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getPackageSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});
