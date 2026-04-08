import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { requireProjectPermission } from "../../utils/projectPermission.js";
import notificationService from "../notification/notification.service.js";

const COMMENT_INCLUDE = {
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
      role: true,
    },
  },
};

// Map entity types to the permission resource key
const RESOURCE_MAP = {
  TASK: "tasks",
  MILESTONE: "milestones",
  PLANNING_STEP: "planningSteps",
};

/**
 * Look up the entity and return its projectId + relevant IDs for notifications.
 */
async function resolveEntity(entityType, entityId) {
  if (entityType === "TASK") {
    const task = await prisma.task.findUnique({
      where: { id: entityId },
      select: { id: true, title: true, projectId: true, assigneeId: true, createdById: true },
    });
    if (!task) throw ApiError.notFound("Task not found");
    return { projectId: task.projectId, title: task.title, notifyUserIds: [task.assigneeId, task.createdById].filter(Boolean) };
  }

  if (entityType === "MILESTONE") {
    const milestone = await prisma.milestone.findUnique({
      where: { id: entityId },
      select: { id: true, title: true, projectId: true, createdById: true },
    });
    if (!milestone) throw ApiError.notFound("Milestone not found");
    return { projectId: milestone.projectId, title: milestone.title, notifyUserIds: [milestone.createdById].filter(Boolean) };
  }

  if (entityType === "PLANNING_STEP") {
    const step = await prisma.planningStep.findUnique({
      where: { id: entityId },
      select: { id: true, title: true, projectId: true, createdById: true },
    });
    if (!step) throw ApiError.notFound("Planning step not found");
    return { projectId: step.projectId, title: step.title, notifyUserIds: [step.createdById].filter(Boolean) };
  }

  throw ApiError.badRequest("Invalid entity type");
}

class CommentService {
  async createComment(data, userId) {
    const { entityType, entityId, content } = data;

    const entity = await resolveEntity(entityType, entityId);
    const resource = RESOURCE_MAP[entityType];

    // Check comment permission
    await requireProjectPermission(userId, entity.projectId, resource, "comment");

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        entityType,
        entityId,
        authorId: userId,
      },
      include: COMMENT_INCLUDE,
    });

    // Send notifications (fire-and-forget)
    const sender = comment.author;
    const senderName = `${sender.firstName} ${sender.lastName}`;
    const entityLabel = entityType === "PLANNING_STEP" ? "planning step" : entityType.toLowerCase();

    const uniqueRecipients = [...new Set(entity.notifyUserIds)].filter((id) => id !== userId);

    for (const recipientId of uniqueRecipients) {
      notificationService
        .send({
          userId: recipientId,
          title: `New comment on ${entityLabel}`,
          description: `${senderName} commented on "${entity.title}"`,
          type: "PROJECT",
          channel: "IN_APP",
        })
        .catch((err) => console.error("[CommentService] Notification failed:", err.message));
    }

    return comment;
  }

  async getComments(entityType, entityId, userId) {
    const entity = await resolveEntity(entityType, entityId);
    const resource = RESOURCE_MAP[entityType];

    // Only need view permission to read comments
    await requireProjectPermission(userId, entity.projectId, resource, "view");

    return prisma.comment.findMany({
      where: { entityType, entityId },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
  }

  async deleteComment(commentId, userId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, entityType: true, entityId: true },
    });

    if (!comment) throw ApiError.notFound("Comment not found");

    // Only the author or OWNER/ADMIN can delete
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (comment.authorId !== userId && !["OWNER", "ADMIN"].includes(user?.role)) {
      throw ApiError.forbidden("You can only delete your own comments");
    }

    await prisma.comment.delete({ where: { id: commentId } });
  }
}

export default new CommentService();
