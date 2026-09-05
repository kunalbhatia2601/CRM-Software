import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import {
  requireProjectPermission,
  canReviewTasks,
  canApproveTasks,
} from "../../utils/projectPermission.js";

const TASK_INCLUDE = {
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  assignedBy: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
  },
  reviewedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  planningStep: {
    select: { id: true, title: true },
  },
  milestone: {
    select: { id: true, title: true },
  },
  parentTask: {
    select: { id: true, title: true, status: true },
  },
  childTasks: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  submissions: {
    orderBy: { round: "desc" },
    select: {
      id: true,
      note: true,
      content: true,
      files: true,
      links: true,
      round: true,
      createdAt: true,
      submittedBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  },
  feedbacks: {
    select: {
      id: true,
      feedback: true,
      nextStep: true,
      statusAfter: true,
      submissionId: true,
      targetRef: true,
      createdAt: true,
      givenBy: {
        select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  meetingTasks: {
    include: {
      meeting: {
        select: { id: true, title: true, phase: true, scheduledAt: true, status: true },
      },
    },
  },
};

const STATUS_LABELS = {
  NEW: "New",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  CLIENT_REVIEW: "Client Review",
  COMPLETED: "Completed",
};

/**
 * Statuses the assignee may set on their own task with no extra permission —
 * they own the "I've seen it / I'm on it / I'm done" part of the flow.
 */
const ASSIGNEE_SELF_STATUSES = ["ACKNOWLEDGED", "IN_PROGRESS", "IN_REVIEW"];

/** Statuses only a reviewer may set: the sign-off end of the flow. */
const REVIEWER_STATUSES = ["CLIENT_REVIEW", "COMPLETED"];

/**
 * Roll planning steps and milestones up from their tasks.
 *
 * A step or milestone is finished when every task under it is COMPLETED, and
 * un-finished the moment one is reopened. Called after any status change so the
 * plan never claims to be done while work is still open — and never stays done
 * after work reopens.
 *
 * Containers with no tasks are left alone: "zero of zero complete" is not a
 * statement anyone made about them.
 *
 * @param {object} tx           active transaction
 * @param {string[]} stepIds
 * @param {string[]} milestoneIds
 * @returns {Promise<{steps: string[], milestones: string[]}>} what changed
 */
export async function rollUpPlan(tx, stepIds = [], milestoneIds = []) {
  const changed = { steps: [], milestones: [] };

  const steps = [...new Set(stepIds.filter(Boolean))];
  const milestones = [...new Set(milestoneIds.filter(Boolean))];
  if (steps.length === 0 && milestones.length === 0) return changed;

  // One grouped count per container instead of a query each.
  const [stepCounts, milestoneCounts, stepRows, milestoneRows] = await Promise.all([
    steps.length
      ? tx.task.groupBy({
          by: ["planningStepId", "status"],
          where: { planningStepId: { in: steps } },
          _count: { id: true },
        })
      : [],
    milestones.length
      ? tx.task.groupBy({
          by: ["milestoneId", "status"],
          where: { milestoneId: { in: milestones } },
          _count: { id: true },
        })
      : [],
    steps.length
      ? tx.planningStep.findMany({ where: { id: { in: steps } }, select: { id: true, status: true } })
      : [],
    milestones.length
      ? tx.milestone.findMany({ where: { id: { in: milestones } }, select: { id: true, status: true } })
      : [],
  ]);

  /** Decide a container's status from its task tally. */
  const verdict = (rows, key, id) => {
    const mine = rows.filter((r) => r[key] === id);
    const total = mine.reduce((sum, r) => sum + r._count.id, 0);
    if (total === 0) return null;
    const done = mine.filter((r) => r.status === "COMPLETED").reduce((sum, r) => sum + r._count.id, 0);
    if (done === total) return "COMPLETED";
    // Some work has landed, so it is under way rather than pending.
    return done > 0 ? "IN_PROGRESS" : null;
  };

  for (const step of stepRows) {
    const next = verdict(stepCounts, "planningStepId", step.id);
    if (!next || next === step.status) continue;
    // Only auto-flip between the two states this rule owns.
    if (step.status === "COMPLETED" || next === "COMPLETED") {
      await tx.planningStep.update({ where: { id: step.id }, data: { status: next } });
      changed.steps.push(step.id);
    }
  }

  for (const ms of milestoneRows) {
    const next = verdict(milestoneCounts, "milestoneId", ms.id);
    if (!next || next === ms.status) continue;
    if (ms.status === "COMPLETED" || next === "COMPLETED") {
      await tx.milestone.update({ where: { id: ms.id }, data: { status: next } });
      changed.milestones.push(ms.id);
    }
  }

  return changed;
}

/** True when a submission payload carries something a reviewer can look at. */
function hasWork(sub) {
  if (!sub) return false;
  return !!(
    sub.content?.trim() ||
    sub.note?.trim() ||
    (Array.isArray(sub.files) && sub.files.length > 0) ||
    (Array.isArray(sub.links) && sub.links.length > 0)
  );
}

/**
 * Authorize a status change.
 *
 * Three groups of moves, three different rights:
 *   - ACKNOWLEDGED / IN_PROGRESS / IN_REVIEW on your own task — the assignee,
 *     no permission needed.
 *   - IN_REVIEW on someone else's task — `tasks.review`, i.e. pulling work in
 *     for checking.
 *   - CLIENT_REVIEW / COMPLETED, or sending reviewed work back for rework —
 *     `tasks.approve`, the sign-off.
 *
 * Owner, admin, account manager and team lead pass both via
 * `checkProjectPermission`; the project's client passes approve only.
 *
 * @param {object} task    the task being moved
 * @param {string} next    target status
 * @param {string} userId
 */
async function authorizeStatusChange(task, next, userId) {
  const isAssignee = task.assigneeId === userId;
  const leavingReview = ["IN_REVIEW", "CLIENT_REVIEW"].includes(task.status);

  // Rework — pulling reviewed work back is the reviewer's call, checked before
  // the assignee shortcut so an assignee can't quietly retract their own
  // submission and erase the redo from their KPI.
  if (leavingReview && !REVIEWER_STATUSES.includes(next)) {
    if (isAssignee && task.status === "IN_REVIEW" && next === "IN_PROGRESS") {
      throw ApiError.forbidden(
        "This task is under review — ask a reviewer to send it back"
      );
    }
    if (await canApproveTasks(userId, task.projectId)) return;
    await requireProjectPermission(userId, task.projectId, "tasks", "edit");
    return;
  }

  // The assignee drives their own work forward without needing task edit rights.
  if (isAssignee && ASSIGNEE_SELF_STATUSES.includes(next)) return;

  if (REVIEWER_STATUSES.includes(next)) {
    if (await canApproveTasks(userId, task.projectId)) return;
    throw ApiError.forbidden(
      `You need approve permission to move a task to ${STATUS_LABELS[next] || next}`
    );
  }

  // Pulling someone else's task in for checking.
  if (next === "IN_REVIEW") {
    if (await canReviewTasks(userId, task.projectId)) return;
    throw ApiError.forbidden("You need review permission to send a task for review");
  }

  // Everything else needs ordinary task edit rights.
  await requireProjectPermission(userId, task.projectId, "tasks", "edit");
}

class TaskService {
  async createTask(data, createdById) {
    await requireProjectPermission(createdById, data.projectId, "tasks", "create");

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw ApiError.notFound("Project not found");

    if (data.planningStepId) {
      const step = await prisma.planningStep.findUnique({ where: { id: data.planningStepId } });
      if (!step || step.projectId !== data.projectId) {
        throw ApiError.badRequest("Planning step not found or does not belong to this project");
      }
    }

    if (data.milestoneId) {
      const milestone = await prisma.milestone.findUnique({ where: { id: data.milestoneId } });
      if (!milestone || milestone.projectId !== data.projectId) {
        throw ApiError.badRequest("Milestone not found or does not belong to this project");
      }
    }

    if (data.parentTaskId) {
      const parentTask = await prisma.task.findUnique({ where: { id: data.parentTaskId } });
      if (!parentTask || parentTask.projectId !== data.projectId) {
        throw ApiError.badRequest("Parent task not found or does not belong to this project");
      }
    }

    const maxPos = await prisma.task.aggregate({
      where: { projectId: data.projectId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        objectives: data.objectives || null,
        deliverables: data.deliverables || null,
        references: data.references ?? null,
        status: data.status || "NEW",
        priority: data.priority || "MEDIUM",
        position,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        planningStepId: data.planningStepId || null,
        milestoneId: data.milestoneId || null,
        assigneeId: data.assigneeId || null,
        assignedById: data.assigneeId ? createdById : null,
        parentTaskId: data.parentTaskId || null,
        internalCostAmount: data.internalCostAmount ?? null,
        internalCostType: data.internalCostType || "NONE",
        createdById,
      },
      include: TASK_INCLUDE,
    });
  }

  async getTasksByProject(projectId, userId, filters = {}) {
    await requireProjectPermission(userId, projectId, "tasks", "view");

    const where = { projectId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.planningStepId) where.planningStepId = filters.planningStepId;
    if (filters.milestoneId) where.milestoneId = filters.milestoneId;
    if (filters.planningStepId === "none") {
      where.planningStepId = null;
    }

    return prisma.task.findMany({
      where,
      include: TASK_INCLUDE,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
  }

  async getTaskById(id, userId) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });
    if (!task) throw ApiError.notFound("Task not found");

    await requireProjectPermission(userId, task.projectId, "tasks", "view");
    return task;
  }

  async updateTask(id, data, userId) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw ApiError.notFound("Task not found");

    const statusChanged = data.status !== undefined && data.status !== task.status;
    const reviewNotes = Array.isArray(data.reviewNotes) ? data.reviewNotes : [];
    // "Keep In Review" is a review with no status change — it must still be
    // authorized as a review and must still persist its notes.
    const isReviewOnly = !statusChanged && (reviewNotes.length > 0 || !!data.feedback?.trim());

    // ── Permission checks ──
    // Submitting work travels with the status change, so it must not count as
    // "editing the task" and trip the edit-permission check.
    const statusOnly =
      statusChanged &&
      Object.keys(data).every((k) =>
        [
          "status", "feedback", "nextStep",
          "submission", "submissionId", "targetRef", "reviewNotes",
        ].includes(k)
      );

    if (statusChanged) {
      await authorizeStatusChange(task, data.status, userId);

      // Handing a task in means showing the work — but only for the assignee
      // submitting it. A manager pulling a task into review, or reopening one
      // from COMPLETED, has nothing of their own to attach.
      if (
        data.status === "IN_REVIEW" &&
        task.assigneeId === userId &&
        !hasWork(data.submission)
      ) {
        const existing = await prisma.taskSubmission.count({ where: { taskId: id } });
        if (existing === 0) {
          throw ApiError.badRequest(
            "Attach your work before sending this for review — a note, written content, files, or links"
          );
        }
      }

      // Touching any other field alongside the status still needs edit rights —
      // the assignee's free pass covers the status column only.
      if (!statusOnly) {
        await requireProjectPermission(userId, task.projectId, "tasks", "edit");
      }
    } else if (isReviewOnly) {
      const [mayReview, mayApprove] = await Promise.all([
        canReviewTasks(userId, task.projectId),
        canApproveTasks(userId, task.projectId),
      ]);
      if (!mayReview && !mayApprove) {
        await requireProjectPermission(userId, task.projectId, "tasks", "edit");
      }
    } else {
      await requireProjectPermission(userId, task.projectId, "tasks", "edit");
    }

    // ── Build update payload ──
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.objectives !== undefined) updateData.objectives = data.objectives;
    if (data.deliverables !== undefined) updateData.deliverables = data.deliverables;
    if (data.references !== undefined) updateData.references = data.references;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    // Track delegation: whoever changes the assignee is recorded as the assigner.
    const assigneeChanged =
      data.assigneeId !== undefined && (data.assigneeId || null) !== task.assigneeId;
    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId || null;
      if (assigneeChanged) updateData.assignedById = data.assigneeId ? userId : null;
    }
    if (data.planningStepId !== undefined) updateData.planningStepId = data.planningStepId || null;
    if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId || null;
    if (data.internalCostAmount !== undefined) updateData.internalCostAmount = data.internalCostAmount ?? null;
    if (data.internalCostType !== undefined) updateData.internalCostType = data.internalCostType || "NONE";

    // ── Handle status transition timestamps ──
    if (statusChanged) {
      updateData.status = data.status;

      // COMPLETED is the sign-off, so it stamps both the completion time and
      // who approved it. Reopening the task clears them.
      if (data.status === "COMPLETED" && task.status !== "COMPLETED") {
        updateData.completedAt = new Date();
        updateData.reviewedAt = new Date();
        updateData.reviewedById = userId;
      } else if (data.status !== "COMPLETED" && task.status === "COMPLETED") {
        updateData.completedAt = null;
        updateData.reviewedAt = null;
        updateData.reviewedById = null;
      }
    }

    // ── Every status change is tracked as a feedback entry ──
    if (statusChanged) {
      // Auto-compute nextStep: "Sent to {NewStatusLabel}"
      const autoNextStep = `Sent to ${STATUS_LABELS[data.status] || data.status}`;

      return prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id },
          data: updateData,
        });

        // A hand-in becomes its own row so rework rounds stay side by side.
        let submissionId = data.submissionId || null;
        if (data.status === "IN_REVIEW" && hasWork(data.submission)) {
          const last = await tx.taskSubmission.findFirst({
            where: { taskId: id },
            orderBy: { round: "desc" },
            select: { round: true },
          });

          const created = await tx.taskSubmission.create({
            data: {
              taskId: id,
              submittedById: userId,
              note: data.submission.note?.trim() || null,
              content: data.submission.content?.trim() || null,
              files: data.submission.files ?? [],
              links: data.submission.links ?? [],
              round: (last?.round ?? 0) + 1,
            },
            select: { id: true },
          });
          submissionId = created.id;
        }

        // A reviewer who does not name a submission is responding to the
        // latest one, so link it for them.
        if (!submissionId && ["CLIENT_REVIEW", "COMPLETED", "IN_PROGRESS"].includes(data.status)) {
          const latest = await tx.taskSubmission.findFirst({
            where: { taskId: id },
            orderBy: { round: "desc" },
            select: { id: true },
          });
          submissionId = latest?.id || null;
        }

        await tx.taskFeedback.create({
          data: {
            // Feedback text is optional — use user-provided or null
            feedback: data.feedback?.trim() || null,
            // nextStep: user-provided takes priority, otherwise auto-fill
            nextStep: data.nextStep?.trim() || autoNextStep,
            statusAfter: data.status,
            submissionId,
            targetRef: data.targetRef ?? null,
            taskId: id,
            givenById: userId,
          },
        });

        // Per-item notes raised during the review. They share the resulting
        // status so the whole review reads as one event in the history.
        if (reviewNotes.length > 0) {
          await tx.taskFeedback.createMany({
            data: reviewNotes.map((n) => ({
              feedback: n.feedback.trim(),
              nextStep: null,
              statusAfter: data.status,
              submissionId: n.submissionId || submissionId,
              targetRef: n.targetRef ?? null,
              taskId: id,
              givenById: userId,
            })),
          });
        }

        // A completed task may finish its step or milestone; a reopened one
        // may un-finish them.
        await rollUpPlan(
          tx,
          [updateData.planningStepId ?? task.planningStepId],
          [updateData.milestoneId ?? task.milestoneId]
        );

        return tx.task.findUnique({
          where: { id },
          include: TASK_INCLUDE,
        });
      });
    }

    // ── Reassignment is part of a task's history, so record it ──
    if (assigneeChanged) {
      const [from, to] = await Promise.all([
        task.assigneeId
          ? prisma.user.findUnique({ where: { id: task.assigneeId }, select: { firstName: true, lastName: true } })
          : null,
        updateData.assigneeId
          ? prisma.user.findUnique({ where: { id: updateData.assigneeId }, select: { firstName: true, lastName: true } })
          : null,
      ]);
      const name = (u) => (u ? `${u.firstName} ${u.lastName}` : "Unassigned");

      return prisma.$transaction(async (tx) => {
        await tx.task.update({ where: { id }, data: updateData });

        await tx.taskFeedback.create({
          data: {
            feedback: data.feedback?.trim() || null,
            nextStep: `Reassigned from ${name(from)} to ${name(to)}`,
            statusAfter: task.status,
            taskId: id,
            givenById: userId,
          },
        });

        return tx.task.findUnique({ where: { id }, include: TASK_INCLUDE });
      });
    }

    // ── Non-status update: field edits, or a review that left the status alone ──
    if (data.feedback?.trim() || reviewNotes.length > 0) {
      const latest = await prisma.taskSubmission.findFirst({
        where: { taskId: id },
        orderBy: { round: "desc" },
        select: { id: true },
      });
      const fallbackSubmissionId = data.submissionId || latest?.id || null;

      return prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id },
          data: updateData,
        });

        if (data.feedback?.trim()) {
          await tx.taskFeedback.create({
            data: {
              feedback: data.feedback.trim(),
              nextStep: data.nextStep?.trim() || null,
              statusAfter: task.status, // status didn't change
              submissionId: fallbackSubmissionId,
              targetRef: data.targetRef ?? null,
              taskId: id,
              givenById: userId,
            },
          });
        }

        if (reviewNotes.length > 0) {
          await tx.taskFeedback.createMany({
            data: reviewNotes.map((n) => ({
              feedback: n.feedback.trim(),
              nextStep: null,
              statusAfter: task.status,
              submissionId: n.submissionId || fallbackSubmissionId,
              targetRef: n.targetRef ?? null,
              taskId: id,
              givenById: userId,
            })),
          });
        }

        return tx.task.findUnique({
          where: { id },
          include: TASK_INCLUDE,
        });
      });
    }

    return prisma.task.update({
      where: { id },
      data: updateData,
      include: TASK_INCLUDE,
    });
  }

  async deleteTask(id, userId) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw ApiError.notFound("Task not found");

    await requireProjectPermission(userId, task.projectId, "tasks", "delete");

    await prisma.task.delete({ where: { id } });
  }

  async bulkUpdateStatus(taskIds, status, userId) {
    if (!taskIds || taskIds.length === 0) throw ApiError.badRequest("No task IDs provided");

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, projectId: true, status: true, assigneeId: true, planningStepId: true, milestoneId: true },
    });

    if (tasks.length !== taskIds.length) throw ApiError.badRequest("Some tasks not found");

    const projectIds = [...new Set(tasks.map((t) => t.projectId))];
    if (projectIds.length > 1) throw ApiError.badRequest("All tasks must belong to the same project");

    const projectId = projectIds[0];

    // Same rules as a single update, applied to every task in the batch.
    for (const t of tasks) {
      await authorizeStatusChange(t, status, userId);
    }

    const updateData = { status };
    if (status === "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.reviewedAt = new Date();
      updateData.reviewedById = userId;
    }

    const autoNextStep = `Sent to ${STATUS_LABELS[status] || status}`;

    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { id: { in: taskIds } },
        data: updateData,
      });

      // Track each status change
      await tx.taskFeedback.createMany({
        data: tasks
          .filter((t) => t.status !== status) // only tasks that actually changed
          .map((t) => ({
            feedback: null,
            nextStep: autoNextStep,
            statusAfter: status,
            taskId: t.id,
            givenById: userId,
          })),
      });

      await rollUpPlan(
        tx,
        tasks.map((t) => t.planningStepId),
        tasks.map((t) => t.milestoneId)
      );
    });

    return prisma.task.findMany({
      where: { id: { in: taskIds } },
      include: TASK_INCLUDE,
    });
  }

  /**
   * Add standalone feedback to a task (no status change).
   */
  async addFeedback(taskId, data, userId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw ApiError.notFound("Task not found");

    // Review feedback comes from whoever may review or sign off this work.
    const [mayReview, mayApprove] = await Promise.all([
      canReviewTasks(userId, task.projectId),
      canApproveTasks(userId, task.projectId),
    ]);
    if (!mayReview && !mayApprove) {
      throw ApiError.forbidden("You do not have permission to review this task");
    }

    await prisma.taskFeedback.create({
      data: {
        feedback: data.feedback?.trim() || null,
        nextStep: data.nextStep?.trim() || null,
        statusAfter: data.statusAfter || task.status,
        submissionId: data.submissionId || null,
        targetRef: data.targetRef ?? null,
        taskId,
        givenById: userId,
      },
    });

    return prisma.task.findUnique({
      where: { id: taskId },
      include: TASK_INCLUDE,
    });
  }

  /**
   * A user's tasks across every project.
   *
   * `scope: "delegated"` flips this around to the work they handed to someone
   * else — tasks they assigned but do not own — so a lead can track what is out
   * with their team. Self-assigned tasks are excluded there; they already show
   * under the default scope and would otherwise appear twice.
   */
  async getMyTasks(userId, filters = {}) {
    const where =
      filters.scope === "delegated"
        ? { assignedById: userId, NOT: { assigneeId: userId } }
        : { assigneeId: userId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.projectId) where.projectId = filters.projectId;

    return prisma.task.findMany({
      where,
      include: {
        ...TASK_INCLUDE,
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async getChildTasks(taskId, userId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw ApiError.notFound("Task not found");

    await requireProjectPermission(userId, task.projectId, "tasks", "view");

    return prisma.task.findMany({
      where: { parentTaskId: taskId },
      include: TASK_INCLUDE,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
  }
}

export default new TaskService();
