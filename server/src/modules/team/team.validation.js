import { z } from "zod";

const categoryPermissions = z.object({
  view: z.boolean().optional(),
  create: z.boolean().optional(),
  edit: z.boolean().optional(),
  delete: z.boolean().optional(),
  review: z.boolean().optional(),
  approve: z.boolean().optional(),
  comment: z.boolean().optional(),
});

const permissionsSchema = z.object({
  tasks: categoryPermissions,
  milestones: categoryPermissions,
  planningSteps: categoryPermissions.optional(),
});

export const createTeamSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional().nullable(),
    avatar: z.string().max(500).optional().nullable(),
    leadId: z.string().optional().nullable(),
    memberIds: z.array(z.string().min(1)).optional(),
  }),
});

export const listTeamsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "name"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getTeamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const updateTeamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    avatar: z.string().max(500).optional().nullable(),
    leadId: z.string().optional().nullable(),
  }),
});

export const addMemberSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    userId: z.string().min(1),
    permissions: permissionsSchema.optional(),
  }),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const updateMemberPermissionsSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
  }),
  body: z.object({
    permissions: permissionsSchema,
  }),
});
