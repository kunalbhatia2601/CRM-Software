import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const CLIENT_INCLUDE = {
  accountManager: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  },
  deal: {
    select: { id: true, title: true, value: true, stage: true },
  },
  projects: {
    select: { id: true, name: true, status: true, startDate: true, endDate: true },
    orderBy: { createdAt: "desc" },
  },
  // CLIENT-role login accounts linked to this company (client portal users)
  portalUsers: {
    select: { id: true, firstName: true, lastName: true, email: true, status: true, lastLoginAt: true },
    orderBy: { createdAt: "asc" },
  },
};

class ClientService {
  /**
   * Lightweight list of all clients for dropdowns (id + companyName + status)
   */
  async listAllClientsForDropdown() {
    return prisma.client.findMany({
      select: { id: true, companyName: true, contactName: true, status: true },
      orderBy: { companyName: "asc" },
    });
  }

  /**
   * Create client manually (not from deal conversion)
   */
  async createClient(data) {
    if (data.email) {
      const existing = await prisma.client.findUnique({ where: { email: data.email } });
      if (existing) {
        throw ApiError.conflict("A client with this email already exists");
      }
    }

    if (data.accountManagerId) {
      const am = await prisma.user.findUnique({ where: { id: data.accountManagerId } });
      if (!am) throw ApiError.badRequest("Account manager not found");
      if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
        throw ApiError.badRequest("Must be Owner, Admin, or Account Manager role");
      }
    }

    return prisma.client.create({
      data,
      include: CLIENT_INCLUDE,
    });
  }

  /**
   * List clients with pagination, filters, search
   */
  async listClients({ page, limit, status, accountManagerId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (accountManagerId) where.accountManagerId = accountManagerId;

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: CLIENT_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single client with full details
   */
  async getClientById(id) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: CLIENT_INCLUDE,
    });

    if (!client) throw ApiError.notFound("Client not found");
    return client;
  }

  /**
   * Update client
   */
  async updateClient(id, data) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) throw ApiError.notFound("Client not found");

    if (data.email && data.email !== client.email) {
      const emailTaken = await prisma.client.findUnique({ where: { email: data.email } });
      if (emailTaken) throw ApiError.conflict("A client with this email already exists");
    }

    if (data.accountManagerId) {
      const am = await prisma.user.findUnique({ where: { id: data.accountManagerId } });
      if (!am) throw ApiError.badRequest("Account manager not found");
      if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
        throw ApiError.badRequest("Must be Owner, Admin, or Account Manager role");
      }
    }

    return prisma.client.update({
      where: { id },
      data,
      include: CLIENT_INCLUDE,
    });
  }

  /**
   * Delete client (only if INACTIVE/CHURNED and no active projects)
   */
  async deleteClient(id) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { projects: { where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] } } } },
    });

    if (!client) throw ApiError.notFound("Client not found");

    if (client.status === "ACTIVE") {
      throw ApiError.badRequest("Cannot delete an active client. Set to inactive first.");
    }

    if (client.projects.length > 0) {
      throw ApiError.badRequest("Cannot delete client with active projects");
    }

    await prisma.client.delete({ where: { id } });
  }
}

export default new ClientService();
