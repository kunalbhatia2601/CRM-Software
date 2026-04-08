import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { requireProjectPermission } from "../../utils/projectPermission.js";

const MILESTONE_INCLUDE = {
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  tasks: {
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      assigneeId: true,
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { position: "asc" },
  },
};

class MilestoneService {
  async createMilestone(data, createdById) {
    await requireProjectPermission(createdById, data.projectId, "milestones", "create");

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw ApiError.notFound("Project not found");

    // Auto-compute position
    const maxPos = await prisma.milestone.aggregate({
      where: { projectId: data.projectId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    return prisma.milestone.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status || "PENDING",
        position,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        createdById,
      },
      include: MILESTONE_INCLUDE,
    });
  }

  async getMilestonesByProject(projectId, userId) {
    await requireProjectPermission(userId, projectId, "milestones", "view");

    return prisma.milestone.findMany({
      where: { projectId },
      include: MILESTONE_INCLUDE,
      orderBy: { position: "asc" },
    });
  }

  async getMilestoneById(id, userId) {
    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: MILESTONE_INCLUDE,
    });
    if (!milestone) throw ApiError.notFound("Milestone not found");

    await requireProjectPermission(userId, milestone.projectId, "milestones", "view");
    return milestone;
  }

  async updateMilestone(id, data, userId) {
    const milestone = await prisma.milestone.findUnique({ where: { id } });
    if (!milestone) throw ApiError.notFound("Milestone not found");

    await requireProjectPermission(userId, milestone.projectId, "milestones", "edit");

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    // Auto-set completedAt
    if (data.status === "COMPLETED" && milestone.status !== "COMPLETED") {
      updateData.completedAt = new Date();
    } else if (data.status !== undefined && data.status !== "COMPLETED" && milestone.status === "COMPLETED") {
      updateData.completedAt = null;
    }

    return prisma.milestone.update({
      where: { id },
      data: updateData,
      include: MILESTONE_INCLUDE,
    });
  }

  async deleteMilestone(id, userId) {
    const milestone = await prisma.milestone.findUnique({ where: { id } });
    if (!milestone) throw ApiError.notFound("Milestone not found");

    await requireProjectPermission(userId, milestone.projectId, "milestones", "delete");

    // Unlink tasks from this milestone before deleting
    await prisma.task.updateMany({
      where: { milestoneId: id },
      data: { milestoneId: null },
    });

    await prisma.milestone.delete({ where: { id } });
  }

  async reorderMilestones(projectId, milestoneIds, userId) {
    await requireProjectPermission(userId, projectId, "milestones", "edit");

    await prisma.$transaction(
      milestoneIds.map((id, index) =>
        prisma.milestone.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return prisma.milestone.findMany({
      where: { projectId },
      include: MILESTONE_INCLUDE,
      orderBy: { position: "asc" },
    });
  }
}

export default new MilestoneService();
