import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { requireProjectPermission } from "../../utils/projectPermission.js";

const TASK_INCLUDE = {
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
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
};

const STATUS_LABELS = {
  TODO: "Todo",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  COMPLETED: "Completed",
  REVIEWED: "Reviewed",
};

/**
 * Check if user is OWNER, ADMIN, or the CLIENT linked to the project.
 * Only these roles can move tasks to REVIEWED.
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

  return false;
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
        status: data.status || "TODO",
        priority: data.priority || "MEDIUM",
        position,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        planningStepId: data.planningStepId || null,
        milestoneId: data.milestoneId || null,
        assigneeId: data.assigneeId || null,
        parentTaskId: data.parentTaskId || null,
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
    if (statusChanged) {
      if (data.status === "REVIEWED") {
        const allowed = await canReviewTask(userId, task.projectId);
        if (!allowed) {
          throw ApiError.forbidden("Only the project client, owner, or admin can review tasks");
        }
      } else if (data.status === "IN_REVIEW") {
        await requireProjectPermission(userId, task.projectId, "tasks", "review");
      } else {
        await requireProjectPermission(userId, task.projectId, "tasks", "edit");
      }
    } else {
      await requireProjectPermission(userId, task.projectId, "tasks", "edit");
    }

    // ── Build update payload ──
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId || null;
    if (data.planningStepId !== undefined) updateData.planningStepId = data.planningStepId || null;
    if (data.milestoneId !== undefined) updateData.milestoneId = data.milestoneId || null;

    // ── Handle status transition timestamps ──
    if (statusChanged) {
      updateData.status = data.status;

      if (data.status === "COMPLETED" && task.status !== "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (data.status !== "COMPLETED" && task.status === "COMPLETED") {
        updateData.completedAt = null;
      }

      if (data.status === "REVIEWED" && task.status !== "REVIEWED") {
        updateData.reviewedAt = new Date();
        updateData.reviewedById = userId;
      } else if (data.status !== "REVIEWED" && task.status === "REVIEWED") {
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
      select: { id: true, projectId: true, status: true },
    });

    if (tasks.length !== taskIds.length) throw ApiError.badRequest("Some tasks not found");

    const projectIds = [...new Set(tasks.map((t) => t.projectId))];
    if (projectIds.length > 1) throw ApiError.badRequest("All tasks must belong to the same project");

    const projectId = projectIds[0];

    if (status === "REVIEWED") {
      const allowed = await canReviewTask(userId, projectId);
      if (!allowed) {
        throw ApiError.forbidden("Only the project client, owner, or admin can review tasks");
      }
    } else if (status === "IN_REVIEW") {
      await requireProjectPermission(userId, projectId, "tasks", "review");
    } else {
      await requireProjectPermission(userId, projectId, "tasks", "edit");
    }

    const updateData = { status };
    if (status === "COMPLETED") updateData.completedAt = new Date();
    if (status === "REVIEWED") {
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
