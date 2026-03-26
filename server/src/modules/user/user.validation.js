import { z } from "zod";

const roles = [
  "OWNER",
  "ADMIN",
  "SALES_MANAGER",
  "ACCOUNT_MANAGER",
  "FINANCE_MANAGER",
  "HR",
  "EMPLOYEE",
  "CLIENT",
];

const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED", "INVITED"];

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    phone: z.string().optional(),
    avatar: z.string().max(500).nullable().optional(),
    role: z.enum(roles, { required_error: "Role is required" }),
    status: z.enum(statuses).optional(),
    clientId: z.string().nullable().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    email: z.string().email("Invalid email address").optional(),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    role: z.enum(roles).optional(),
    status: z.enum(statuses).optional(),
    clientId: z.string().nullable().optional(),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    role: z.enum(roles).optional(),
    status: z.enum(statuses).optional(),
    search: z.string().optional(),
    sortBy: z
      .enum(["createdAt", "firstName", "lastName", "email", "role", "status"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
