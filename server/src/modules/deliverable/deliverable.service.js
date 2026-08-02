import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import notificationService from "../notification/notification.service.js";

// Normalize an id array: drop empties + duplicates.
function uniqIds(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter((v) => typeof v === "string" && v.trim()))];
}

/**
 * Reject link ids that point at records which no longer exist.
 * Any status is linkable.
 * @param {string[]} ids
 * @param {"milestone"|"planningStep"|"task"} model
 */
async function assertLinkable(ids, model) {
  if (ids.length === 0) return;
  const found = await prisma[model].count({ where: { id: { in: ids } } });
  if (found !== ids.length) throw ApiError.badRequest(`Some linked ${model}s no longer exist`);
}

/** Validate every provided link set on a create/update payload. */
async function assertLinksValid(data) {
  if (data.milestoneIds !== undefined) await assertLinkable(uniqIds(data.milestoneIds), "milestone");
  if (data.planningStepIds !== undefined) await assertLinkable(uniqIds(data.planningStepIds), "planningStep");
  if (data.taskIds !== undefined) await assertLinkable(uniqIds(data.taskIds), "task");
}

const INCLUDE = {
  milestones: { include: { milestone: { select: { id: true, title: true } } } },
  planningSteps: { include: { planningStep: { select: { id: true, title: true } } } },
  tasks: { include: { task: { select: { id: true, title: true, status: true } } } },
  createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  feedbacks: {
    orderBy: { createdAt: "desc" },
    include: {
      givenBy: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
    },
  },
};

class DeliverableService {
  async create(data, createdById) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, name: true, clientId: true },
    });
    if (!project) throw ApiError.notFound("Project not found");

    await assertLinksValid(data);

    const isPublished = data.isPublished ?? false;

    const deliverable = await prisma.deliverable.create({
      data: {
        projectId: project.id,
        title: data.title,
        description: data.description || null,
        content: data.content || null,
        files: data.files ?? [],
        links: data.links ?? [],
        status: data.status || "IN_PROGRESS",
        requiresFeedback: !!data.requiresFeedback,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        createdById,
        milestones: { create: uniqIds(data.milestoneIds).map((milestoneId) => ({ milestoneId })) },
        planningSteps: { create: uniqIds(data.planningStepIds).map((planningStepId) => ({ planningStepId })) },
        tasks: { create: uniqIds(data.taskIds).map((taskId) => ({ taskId })) },
      },
      include: INCLUDE,
    });

    if (isPublished) {
      this.#notifyClient(project, deliverable).catch((e) =>
        console.error("[DeliverableService] notify failed:", e.message)
      );
    }

    return deliverable;
  }

  /** Notify the client's portal users that a deliverable is ready. */
  async #notifyClient(project, deliverable) {
    if (!project.clientId) return;
    const users = await prisma.user.findMany({
      where: { clientId: project.clientId, role: "CLIENT", status: "ACTIVE" },
      select: { id: true },
    });
    if (users.length === 0) return;

    await notificationService.sendBulk({
      userIds: users.map((u) => u.id),
      title: deliverable.requiresFeedback ? `Review needed: ${deliverable.title}` : `New deliverable: ${deliverable.title}`,
      description: `A deliverable for "${project.name}" is ready${deliverable.requiresFeedback ? " and needs your review." : "."}`,
      type: "PROJECT",
      channel: "IN_APP",
    });
  }

  /**
   * List deliverables for a project. CLIENT users only see published ones.
   */
  async listByProject(projectId, user = null) {
    const where = { projectId };
    if (user?.role === "CLIENT") where.isPublished = true;

    return prisma.deliverable.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id, user = null) {
    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: { ...INCLUDE, project: { select: { id: true, name: true, clientId: true } } },
    });
    if (!deliverable) throw ApiError.notFound("Deliverable not found");

    if (user?.role === "CLIENT") {
      if (!deliverable.isPublished || deliverable.project?.clientId !== user.clientId) {
        throw ApiError.notFound("Deliverable not found");
      }
    }
    return deliverable;
  }

  async update(id, data) {
    const existing = await prisma.deliverable.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true, clientId: true } } },
    });
    if (!existing) throw ApiError.notFound("Deliverable not found");

    await assertLinksValid(data);

    const patch = {};
    for (const k of ["title", "description", "content", "status", "requiresFeedback"]) {
      if (data[k] !== undefined) patch[k] = data[k] === "" ? null : data[k];
    }
    if (data.files !== undefined) patch.files = data.files ?? [];
    if (data.links !== undefined) patch.links = data.links ?? [];

    // Publishing for the first time notifies the client.
    const publishingNow = data.isPublished === true && !existing.isPublished;
    if (data.isPublished !== undefined) {
      patch.isPublished = data.isPublished;
      patch.publishedAt = data.isPublished ? (existing.publishedAt || new Date()) : null;
    }

    // Replace link sets when provided
    if (data.milestoneIds !== undefined) {
      patch.milestones = { deleteMany: {}, create: uniqIds(data.milestoneIds).map((milestoneId) => ({ milestoneId })) };
    }
    if (data.planningStepIds !== undefined) {
      patch.planningSteps = { deleteMany: {}, create: uniqIds(data.planningStepIds).map((planningStepId) => ({ planningStepId })) };
    }
    if (data.taskIds !== undefined) {
      patch.tasks = { deleteMany: {}, create: uniqIds(data.taskIds).map((taskId) => ({ taskId })) };
    }

    const updated = await prisma.deliverable.update({ where: { id }, data: patch, include: INCLUDE });

    if (publishingNow) {
      this.#notifyClient(existing.project, updated).catch((e) =>
        console.error("[DeliverableService] notify failed:", e.message)
      );
    }

    return updated;
  }

  async remove(id) {
    const existing = await prisma.deliverable.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Deliverable not found");
    await prisma.deliverable.delete({ where: { id } });
  }

  /**
   * Add feedback. Clients can only review published deliverables of their own project.
   * APPROVED → deliverable COMPLETED. CHANGES_REQUESTED → deliverable + linked task reopened.
   */
  async addFeedback(id, { type = "COMMENT", message }, user) {
    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, clientId: true } },
        tasks: { select: { taskId: true } },
      },
    });
    if (!deliverable) throw ApiError.notFound("Deliverable not found");

    if (user.role === "CLIENT") {
      if (!deliverable.isPublished || deliverable.project?.clientId !== user.clientId) {
        throw ApiError.forbidden("You cannot review this deliverable");
      }
    }

    const linkedTaskIds = (deliverable.tasks || []).map((t) => t.taskId);

    await prisma.deliverableFeedback.create({
      data: { deliverableId: id, type, message: message || null, givenById: user.id },
    });

    // Drive status from the feedback
    let nextStatus = null;
    if (type === "APPROVED") nextStatus = "COMPLETED";
    else if (type === "CHANGES_REQUESTED") nextStatus = "CHANGES_REQUESTED";

    if (nextStatus) {
      await prisma.deliverable.update({ where: { id }, data: { status: nextStatus } });

      // Reopen every linked task so the team picks the work back up
      if (type === "CHANGES_REQUESTED" && linkedTaskIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: linkedTaskIds } },
          data: { status: "IN_PROGRESS", completedAt: null, reviewedAt: null, reviewedById: null },
        });
        await prisma.taskFeedback.createMany({
          data: linkedTaskIds.map((taskId) => ({
            taskId,
            feedback: message || `Client requested changes on deliverable "${deliverable.title}"`,
            nextStep: "Address client feedback",
            statusAfter: "IN_PROGRESS",
            givenById: user.id,
          })),
        });
      }

      // Mark every linked task reviewed when the client approves
      if (type === "APPROVED" && linkedTaskIds.length > 0) {
        await prisma.task.updateMany({
          where: { id: { in: linkedTaskIds } },
          data: { status: "REVIEWED", reviewedAt: new Date(), reviewedById: user.id },
        });
        await prisma.taskFeedback.createMany({
          data: linkedTaskIds.map((taskId) => ({
            taskId,
            feedback: message || `Client approved deliverable "${deliverable.title}"`,
            nextStep: "Approved by client",
            statusAfter: "REVIEWED",
            givenById: user.id,
          })),
        });
      }
    }

    // Tell the project's creator/team that the client responded
    if (user.role === "CLIENT") {
      this.#notifyTeam(deliverable, type, user).catch((e) =>
        console.error("[DeliverableService] team notify failed:", e.message)
      );
    }

    return this.getById(id);
  }

  async #notifyTeam(deliverable, type, user) {
    const recipients = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: ["OWNER", "ADMIN", "ACCOUNT_MANAGER"] } },
      select: { id: true },
    });
    if (recipients.length === 0) return;

    const label = type === "APPROVED" ? "approved" : type === "CHANGES_REQUESTED" ? "requested changes on" : "commented on";
    await notificationService.sendBulk({
      userIds: recipients.map((u) => u.id),
      title: `Client ${label} "${deliverable.title}"`,
      description: `${user.firstName} ${user.lastName} responded on a deliverable in "${deliverable.project?.name}".`,
      type: "PROJECT",
      channel: "IN_APP",
    });
  }
}

export default new DeliverableService();
