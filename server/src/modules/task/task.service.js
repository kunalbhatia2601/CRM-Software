import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { requireProjectPermission } from "../../utils/projectPermission.js";

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
  feedbacks: {
    select: {
      id: true,
      feedback: true,
      nextStep: true,
      statusAfter: true,
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
 * Reviewers: owner, admin, the project's client, the project account manager,
 * and the lead of any team on the project. Only they can move a task out of
 * IN_REVIEW — to CLIENT_REVIEW, to COMPLETED, or back for rework.
 */
async function canReviewTask(userId, projectId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, clientId: true },
  });
  if (!user) return false;

  if (["OWNER", "ADMIN"].includes(user.role)) return true;

  if (user.role === "CLIENT" && user.clientId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });
    if (project && project.clientId === user.clientId) return true;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { accountManagerId: true },
  });
  if (project?.accountManagerId === userId) return true;

  // A team lead owns the work their team delivers, so they can sign it off.
  const led = await prisma.projectTeam.findFirst({
    where: { projectId, team: { leadId: userId } },
    select: { id: true },
  });
  if (led) return true;

  return false;
}

/**
 * Authorize a status change.
 *
 * @param {object} task    the task being moved
 * @param {string} next    target status
 * @param {string} userId
 */
async function authorizeStatusChange(task, next, userId) {
  const isAssignee = task.assigneeId === userId;

  // The assignee drives their own work forward without needing task edit rights.
  if (isAssignee && ASSIGNEE_SELF_STATUSES.includes(next)) return;

  if (REVIEWER_STATUSES.includes(next)) {
    const allowed = await canReviewTask(userId, task.projectId);
    if (!allowed) {
      throw ApiError.forbidden(
        `Only a manager, team lead, account manager or the client can move a task to ${STATUS_LABELS[next] || next}`
      );
    }
    return;
  }

  // Rework: pulling finished work back for changes is a reviewer's call.
  if (["IN_REVIEW", "CLIENT_REVIEW"].includes(task.status) && !isAssignee) {
    const allowed = await canReviewTask(userId, task.projectId);
    if (allowed) return;
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

    // ── Permission checks ──
    const statusOnly =
      statusChanged &&
      Object.keys(data).every((k) => ["status", "feedback", "nextStep"].includes(k));

    if (statusChanged) {
      await authorizeStatusChange(task, data.status, userId);
      // Touching any other field alongside the status still needs edit rights —
      // the assignee's free pass covers the status column only.
      if (!statusOnly) {
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

        await tx.taskFeedback.create({
          data: {
            // Feedback text is optional — use user-provided or null
            feedback: data.feedback?.trim() || null,
            // nextStep: user-provided takes priority, otherwise auto-fill
            nextStep: data.nextStep?.trim() || autoNextStep,
            statusAfter: data.status,
            taskId: id,
            givenById: userId,
          },
        });

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

    // ── Non-status update (just field edits) ──
    // If user provided explicit feedback on a non-status-change edit, still record it
    if (data.feedback?.trim()) {
      return prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id },
          data: updateData,
        });

        await tx.taskFeedback.create({
          data: {
            feedback: data.feedback.trim(),
            nextStep: data.nextStep?.trim() || null,
            statusAfter: task.status, // status didn't change
            taskId: id,
            givenById: userId,
          },
        });

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
      select: { id: true, projectId: true, status: true, assigneeId: true },
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

    // Only OWNER, ADMIN, CLIENT can add feedback
    const allowed = await canReviewTask(userId, task.projectId);
    if (!allowed) {
      throw ApiError.forbidden("Only the project client, owner, or admin can add feedback");
    }

    await prisma.taskFeedback.create({
      data: {
        feedback: data.feedback?.trim() || null,
        nextStep: data.nextStep?.trim() || null,
        statusAfter: data.statusAfter || task.status,
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
   * Get all tasks assigned to a specific user across all projects.
   */
  async getMyTasks(userId, filters = {}) {
    const where = { assigneeId: userId };
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
