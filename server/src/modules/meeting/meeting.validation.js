import { z } from "zod";

const meetingModes = ["VIRTUAL", "IN_PERSON", "PHONE_CALL"];
const meetingStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const meetingPhases = ["REGULAR", "KICKOFF", "PRE_PRODUCTION", "POST_PRODUCTION", "REVIEW"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const taskStatuses = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "IN_REVIEW", "CLIENT_REVIEW", "COMPLETED"];

const requirementSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(priorities).optional(),
});

export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional().nullable(),
    mode: z.enum(meetingModes).optional().default("VIRTUAL"),
    status: z.enum(meetingStatuses).optional().default("SCHEDULED"),
    phase: z.enum(meetingPhases).optional().default("REGULAR"),
    link: z.string().max(500).optional().nullable(),
    scheduledAt: z.coerce.date({ required_error: "Scheduled date/time is required" }),
    duration: z.coerce.number().int().min(1).max(1440).optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    outcome: z.string().max(5000).optional().nullable(),
    requirements: z.array(requirementSchema).optional().nullable(),
    isFollowUp: z.boolean().optional().default(false),
    parentMeetingId: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    dealId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    taskIds: z.array(z.string().min(1)).optional(),
  }),
});

export const updateMeetingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    mode: z.enum(meetingModes).optional(),
    status: z.enum(meetingStatuses).optional(),
    phase: z.enum(meetingPhases).optional(),
    link: z.string().max(500).optional().nullable(),
    scheduledAt: z.coerce.date().optional(),
    duration: z.coerce.number().int().min(1).max(1440).optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    outcome: z.string().max(5000).optional().nullable(),
    requirements: z.array(requirementSchema).optional().nullable(),
    isFollowUp: z.boolean().optional(),
    parentMeetingId: z.string().optional().nullable(),
    taskIds: z.array(z.string().min(1)).optional(),
  }),
});

export const listMeetingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    mode: z.enum(meetingModes).optional(),
    status: z.enum(meetingStatuses).optional(),
    phase: z.enum(meetingPhases).optional(),
    leadId: z.string().optional(),
    dealId: z.string().optional(),
    projectId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "scheduledAt", "title", "status"]).optional().default("scheduledAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
});

export const getMeetingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const deleteMeetingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const completePostProductionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    outcome: z.string().max(5000).optional().nullable(),
    taskFeedbacks: z.array(z.object({
      taskId: z.string().min(1),
      feedback: z.string().max(5000).optional().nullable(),
      nextStep: z.string().max(2000).optional().nullable(),
      statusAfter: z.enum(taskStatuses).optional(),
    })).optional().default([]),
  }),
});
