import { z } from "zod";

const statuses = ["DRAFT", "FINALIZED", "PAID"];
const attStatuses = ["PRESENT", "ABSENT", "HALF_DAY_FIRST", "HALF_DAY_SECOND", "ON_LEAVE", "HOLIDAY", "WEEKEND", "WORK_FROM_HOME", "ON_DUTY"];

const ymQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const listPayrollSchema = z.object({ query: ymQuery });
export const generatePayrollSchema = z.object({
  body: z.object({
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12),
  }),
});

export const previewSchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  query: ymQuery,
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().min(1) }) });

export const setBasePaySchema = z.object({
  params: z.object({ userId: z.string().min(1) }),
  body: z.object({ basePay: z.coerce.number().min(0).nullable() }),
});

export const updateRecordSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    basePay: z.coerce.number().min(0).optional(),
    computedBonus: z.coerce.number().min(0).optional(),
    manualAdjustment: z.coerce.number().optional(),
    status: z.enum(statuses).optional(),
    notes: z.string().max(5000).optional().nullable(),
  }),
});

const slabSchema = z.object({
  minScore: z.coerce.number().min(0).max(100),
  maxScore: z.coerce.number().min(0).max(100),
  bonusAmount: z.coerce.number().min(0),
});

export const updateConfigSchema = z.object({
  body: z.object({
    weightAttendance: z.coerce.number().min(0).optional(),
    weightCompletion: z.coerce.number().min(0).optional(),
    weightOnTime: z.coerce.number().min(0).optional(),
    weightReviewPass: z.coerce.number().min(0).optional(),
    weightRework: z.coerce.number().min(0).optional(),
    bonusSlabs: z.array(slabSchema).optional(),
    presentStatuses: z.array(z.enum(attStatuses)).optional(),
  }),
});
