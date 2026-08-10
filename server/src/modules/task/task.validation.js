import { z } from "zod";

const statuses = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "IN_REVIEW", "CLIENT_REVIEW", "COMPLETED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const costTypes = ["HOUR", "DAY", "MONTH", "NONE"];

const referenceSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().min(1).max(2000),
});

const fileSchema = z.object({
  name: z.string().min(1).max(300),
  url: z.string().min(1),
  key: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  size: z.coerce.number().optional().nullable(),
});

const linkSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().min(1).max(2000),
});

// Work handed in when a task moves to IN_REVIEW.
const submissionSchema = z.object({
  note: z.string().max(5000).optional().nullable(),
  content: z.string().max(20000).optional().nullable(),
  files: z.array(fileSchema).optional().nullable(),
  links: z.array(linkSchema).optional().nullable(),
});

// A reviewer's note may point at one item inside a submission.
const targetRefSchema = z.object({
  kind: z.enum(["CONTENT", "FILE", "LINK"]),
  index: z.coerce.number().int().min(0).optional().nullable(),
  label: z.string().max(300).optional().nullable(),
});

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, "Project ID is required"),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional().nullable(),
    // Content creation fields
    objectives: z.string().max(5000).optional().nullable(),
    deliverables: z.string().max(5000).optional().nullable(),
    references: z.array(referenceSchema).optional().nullable(),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    dueDate: z.string().optional().nullable(),
    planningStepId: z.string().optional().nullable(),
    milestoneId: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    parentTaskId: z.string().optional().nullable(),
    internalCostAmount: z.coerce.number().min(0).optional().nullable(),
    internalCostType: z.enum(costTypes).optional(),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    // Content creation fields
    objectives: z.string().max(5000).optional().nullable(),
    deliverables: z.string().max(5000).optional().nullable(),
    references: z.array(referenceSchema).optional().nullable(),
    status: z.enum(statuses).optional(),
    priority: z.enum(priorities).optional(),
    position: z.coerce.number().int().min(0).optional(),
    dueDate: z.string().optional().nullable(),
    planningStepId: z.string().optional().nullable(),
    milestoneId: z.string().optional().nullable(),
    assigneeId: z.string().optional().nullable(),
    // Feedback fields — recorded on any status change
    feedback: z.string().max(5000).optional().nullable(),
    internalCostAmount: z.coerce.number().min(0).optional().nullable(),
    internalCostType: z.enum(costTypes).optional(),
    nextStep: z.string().max(2000).optional().nullable(),
    // Work handed in alongside a move to IN_REVIEW
    submission: submissionSchema.optional(),
    // Reviewer pointing at what they are responding to
    submissionId: z.string().optional().nullable(),
    targetRef: targetRefSchema.optional().nullable(),
    // Per-item review notes, each pinned to one part of a submission
    reviewNotes: z
      .array(
        z.object({
          feedback: z.string().min(1).max(5000),
          submissionId: z.string().optional().nullable(),
          targetRef: targetRefSchema.optional().nullable(),
        })
      )
      .optional(),
  }),
});

export const getTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const deleteTaskSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const bulkUpdateStatusSchema = z.object({
  body: z.object({
    taskIds: z.array(z.string().min(1)).min(1),
    status: z.enum(statuses),
  }),
});

export const addFeedbackSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    feedback: z.string().min(1, "Feedback is required").max(5000),
    nextStep: z.string().max(2000).optional().nullable(),
    statusAfter: z.enum(statuses).optional(),
    submissionId: z.string().optional().nullable(),
    targetRef: targetRefSchema.optional().nullable(),
  }),
});
