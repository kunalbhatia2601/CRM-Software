import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const SERVICE_INCLUDE = {
  dealServices: {
    select: { id: true, dealId: true, quantity: true, price: true },
  },
  projectServices: {
    select: { id: true, projectId: true, quantity: true, price: true },
  },
};

class ServiceService {
  async createService(data) {
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        salePrice: data.salePrice || null,
        points: data.points || [],
        isActive: data.isActive !== false,
      },
      include: SERVICE_INCLUDE,
    });
    return service;
  }

  async listServices({ page = 1, limit = 10, search, isActive, sortBy = "createdAt", sortOrder = "desc" }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortOptions,
        include: SERVICE_INCLUDE,
      }),
      prisma.service.count({ where }),
    ]);

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getServiceById(id) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: SERVICE_INCLUDE,
    });

    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    return service;
  }

  async updateService(id, data) {
    // Check service exists
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    // Update only provided fields
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice;
    if (data.points !== undefined) updateData.points = data.points;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
      include: SERVICE_INCLUDE,
    });

    return updated;
  }

  async deleteService(id) {
    // Check service exists
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        dealServices: { select: { id: true } },
        projectServices: { select: { id: true } },
      },
    });

    if (!service) {
      throw new ApiError(404, "Service not found");
    }

    // Check if linked to deals or projects
    if (service.dealServices.length > 0 || service.projectServices.length > 0) {
      throw new ApiError(400, "Cannot delete service that is linked to deals or projects");
    }

    await prisma.service.delete({ where: { id } });
  }

  async getActiveServices() {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        salePrice: true,
        description: true,
      },
    });

    return services;
  }
}

export default new ServiceService();
