import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { requireProjectPermission } from "../../utils/projectPermission.js";

const STEP_INCLUDE = {
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
  tasks: {
    select: { id: true, title: true, status: true, priority: true, assigneeId: true },
    orderBy: { position: "asc" },
  },
};

class PlanningStepService {
  async createStep(data, createdById) {
    await requireProjectPermission(createdById, data.projectId, "planningSteps", "create");

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw ApiError.notFound("Project not found");

    // Auto-compute position
    const maxPos = await prisma.planningStep.aggregate({
      where: { projectId: data.projectId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    return prisma.planningStep.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status || "PENDING",
        position,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        projectId: data.projectId,
        createdById,
      },
      include: STEP_INCLUDE,
    });
  }

  async getStepsByProject(projectId, userId) {
    await requireProjectPermission(userId, projectId, "planningSteps", "view");

    return prisma.planningStep.findMany({
      where: { projectId },
      include: STEP_INCLUDE,
      orderBy: { position: "asc" },
    });
  }

  async getStepById(id, userId) {
    const step = await prisma.planningStep.findUnique({
      where: { id },
      include: STEP_INCLUDE,
    });
    if (!step) throw ApiError.notFound("Planning step not found");

    await requireProjectPermission(userId, step.projectId, "planningSteps", "view");
    return step;
  }

  async updateStep(id, data, userId) {
    const step = await prisma.planningStep.findUnique({ where: { id } });
    if (!step) throw ApiError.notFound("Planning step not found");

    await requireProjectPermission(userId, step.projectId, "planningSteps", "edit");

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    return prisma.planningStep.update({
      where: { id },
      data: updateData,
      include: STEP_INCLUDE,
    });
  }

  async deleteStep(id, userId) {
    const step = await prisma.planningStep.findUnique({ where: { id } });
    if (!step) throw ApiError.notFound("Planning step not found");

    await requireProjectPermission(userId, step.projectId, "planningSteps", "delete");

    await prisma.planningStep.delete({ where: { id } });
  }

  async reorderSteps(projectId, stepIds, userId) {
    await requireProjectPermission(userId, projectId, "planningSteps", "edit");

    await prisma.$transaction(
      stepIds.map((id, index) =>
        prisma.planningStep.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return prisma.planningStep.findMany({
      where: { projectId },
      include: STEP_INCLUDE,
      orderBy: { position: "asc" },
    });
  }
}

export default new PlanningStepService();
