import { z } from "zod";

const id = z.string().min(1);

export const projectParamSchema = z.object({ params: z.object({ projectId: id }) });

export const idParamSchema = z.object({ params: z.object({ id }) });

export const startNextSchema = z.object({
  params: z.object({ projectId: id }),
  body: z.object({
    /// Which cycle to copy the plan from. Defaults to the latest one.
    fromCycleId: id.optional(),
    clone: z.boolean().optional(),
    carryOverTaskIds: z.array(id).max(200).optional(),
  }),
});
