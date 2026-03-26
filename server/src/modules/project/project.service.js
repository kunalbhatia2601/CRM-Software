import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * Compute the next billing date from a reference date + billing cycle.
 * Returns null for ONE_TIME.
 */
function computeNextBillingDate(referenceDate, billingCycle) {
  if (!referenceDate || billingCycle === "ONE_TIME") return null;
  const d = new Date(referenceDate);
  switch (billingCycle) {
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      break;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      break;
    case "SEMI_ANNUAL":
      d.setMonth(d.getMonth() + 6);
      break;
    case "ANNUAL":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return d;
}

const PROJECT_INCLUDE = {
  client: {
    select: { id: true, companyName: true, contactName: true, email: true, status: true },
  },
  deal: {
    select: { id: true, title: true, value: true },
  },
  accountManager: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  projectServices: {
    include: {
      service: {
        select: { id: true, name: true, price: true, salePrice: true, points: true, isActive: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
};

class ProjectService {
  /**
   * Create project manually under a client
   */
  async createProject(data, createdById) {
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client) throw ApiError.notFound("Client not found");

    if (client.status !== "ACTIVE") {
      throw ApiError.badRequest("Cannot create project for an inactive client");
    }

    if (data.accountManagerId) {
      const am = await prisma.user.findUnique({ where: { id: data.accountManagerId } });
      if (!am) throw ApiError.badRequest("Account manager not found");
      if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
        throw ApiError.badRequest("Must be Owner, Admin, or Account Manager role");
      }
    }

    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      throw ApiError.badRequest("Start date cannot be after end date");
    }

    // Auto-compute nextBillingDate for recurring projects if not explicitly set
    if (data.billingCycle && data.billingCycle !== "ONE_TIME" && !data.nextBillingDate && data.startDate) {
      data.nextBillingDate = computeNextBillingDate(data.startDate, data.billingCycle);
    }

    // Extract services before creating project (not a Prisma field)
    const servicesInput = data.services;
    delete data.services;

    // If services provided, use a transaction to create project + services
    if (servicesInput && servicesInput.length > 0) {
      return prisma.$transaction(async (tx) => {
        const project = await tx.project.create({
          data: { ...data, createdById },
        });

        // Validate & create project services
        for (const item of servicesInput) {
          const service = await tx.service.findUnique({ where: { id: item.serviceId } });
          if (!service) throw ApiError.badRequest(`Service ${item.serviceId} not found`);

          const originalPrice = item.originalPrice ?? (service.salePrice ?? service.price);
          const price = item.price ?? originalPrice;

          await tx.projectService.create({
            data: {
              projectId: project.id,
              serviceId: item.serviceId,
              quantity: item.quantity || 1,
              price,
              originalPrice,
            },
          });
        }

        // Return with full includes
        return tx.project.findUnique({
          where: { id: project.id },
          include: PROJECT_INCLUDE,
        });
      });
    }

    return prisma.project.create({
      data: { ...data, createdById },
      include: PROJECT_INCLUDE,
    });
  }

  /**
   * List projects with pagination, filters, search
   */
  async listProjects({ page, limit, status, billingCycle, clientId, accountManagerId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (billingCycle) where.billingCycle = billingCycle;
    if (clientId) where.clientId = clientId;
    if (accountManagerId) where.accountManagerId = accountManagerId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { client: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single project
   */
  async getProjectById(id) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });

    if (!project) throw ApiError.notFound("Project not found");
    return project;
  }

  /**
   * Update project
   */
  async updateProject(id, data) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw ApiError.notFound("Project not found");

    if (["COMPLETED", "CANCELLED"].includes(project.status) && data.status === undefined) {
      throw ApiError.badRequest("Cannot edit a completed or cancelled project without changing status");
    }

    if (data.accountManagerId) {
      const am = await prisma.user.findUnique({ where: { id: data.accountManagerId } });
      if (!am) throw ApiError.badRequest("Account manager not found");
      if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
        throw ApiError.badRequest("Must be Owner, Admin, or Account Manager role");
      }
    }

    const startDate = data.startDate ? new Date(data.startDate) : project.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : project.endDate;
    if (startDate && endDate && startDate > endDate) {
      throw ApiError.badRequest("Start date cannot be after end date");
    }

    // Auto-recompute nextBillingDate when billingCycle changes
    const newCycle = data.billingCycle || project.billingCycle;
    if (data.billingCycle !== undefined || data.startDate !== undefined) {
      const refDate = data.startDate ? new Date(data.startDate) : project.startDate;
      if (newCycle === "ONE_TIME") {
        data.nextBillingDate = null;
      } else if (refDate && !data.nextBillingDate) {
        data.nextBillingDate = computeNextBillingDate(refDate, newCycle);
      }
    }

    return prisma.project.update({
      where: { id },
      data,
      include: PROJECT_INCLUDE,
    });
  }

  /**
   * Delete project (only NOT_STARTED or CANCELLED)
   */
  async deleteProject(id) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw ApiError.notFound("Project not found");

    if (!["NOT_STARTED", "CANCELLED"].includes(project.status)) {
      throw ApiError.badRequest("Only projects with status NOT_STARTED or CANCELLED can be deleted");
    }

    await prisma.project.delete({ where: { id } });
  }
}

export default new ProjectService();
