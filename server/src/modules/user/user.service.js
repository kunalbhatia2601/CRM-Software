import bcrypt from "bcryptjs";
import prisma from "../../utils/prisma.js";
import config from "../../config/index.js";
import { ApiError } from "../../utils/apiError.js";

// Fields safe to return (never expose password)
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  role: true,
  status: true,
  isEmailVerified: true,
  lastLoginAt: true,
  clientId: true,
  client: {
    select: { id: true, companyName: true, contactName: true, status: true },
  },
  createdAt: true,
  updatedAt: true,
};

class UserService {
  /**
   * Create a new user (Owner only)
   */
  async createUser(data) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw ApiError.conflict("A user with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

    // Validate clientId if provided (only for CLIENT role)
    if (data.clientId) {
      if (data.role !== "CLIENT") {
        throw ApiError.badRequest("clientId can only be set for users with CLIENT role");
      }
      const client = await prisma.client.findUnique({ where: { id: data.clientId } });
      if (!client) {
        throw ApiError.badRequest("Linked client company not found");
      }
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        avatar: data.avatar || null,
        role: data.role,
        status: data.status || "ACTIVE",
        clientId: data.role === "CLIENT" ? (data.clientId || null) : null,
      },
      select: USER_SELECT,
    });

    return user;
  }

  /**
   * List users with pagination, filters, search, sort
   */
  async listUsers({ page, limit, role, status, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;

    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single user by ID
   */
  async getUserById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return user;
  }

  /**
   * Update user details (not password)
   */
  async updateUser(id, data) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if(user.role == "OWNER") {
      throw ApiError.badRequest("Users with role OWNER cannot be updated");
    }

    // If email is being changed, check for duplicates
    if (data.email && data.email !== user.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailTaken) {
        throw ApiError.conflict("A user with this email already exists");
      }
    }

    // Handle clientId — only valid for CLIENT role
    const effectiveRole = data.role || user.role;
    if (data.clientId !== undefined) {
      if (effectiveRole !== "CLIENT") {
        // Clear clientId if role is changing away from CLIENT
        data.clientId = null;
      } else if (data.clientId) {
        const client = await prisma.client.findUnique({ where: { id: data.clientId } });
        if (!client) throw ApiError.badRequest("Linked client company not found");
      }
    }

    // If role changes away from CLIENT, clear the clientId
    if (data.role && data.role !== "CLIENT" && user.clientId) {
      data.clientId = null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });

    return updated;
  }

  /**
   * Reset a user's password (Owner only)
   */
  async resetPassword(id, newPassword) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Revoke all refresh tokens so user is forced to re-login
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }

  /**
   * Get a full report for a user — all associated leads, deals, clients, projects
   */
  async getUserReport(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        // For CLIENT role: also fetch their company's deals and projects
        client: {
          select: {
            id: true, companyName: true, contactName: true, email: true,
            phone: true, address: true, industry: true, website: true,
            status: true, createdAt: true,
            deal: { select: { id: true, title: true, value: true, stage: true } },
            projects: {
              select: {
                id: true, name: true, status: true, budget: true,
                startDate: true, endDate: true, createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        // Leads created by or assigned to this user
        createdLeads: {
          select: {
            id: true, companyName: true, contactName: true, status: true,
            priority: true, source: true, estimatedValue: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        assignedLeads: {
          select: {
            id: true, companyName: true, contactName: true, status: true,
            priority: true, source: true, estimatedValue: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        // Deals
        createdDeals: {
          select: {
            id: true, title: true, stage: true, value: true, createdAt: true,
            lead: { select: { companyName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        assignedDeals: {
          select: {
            id: true, title: true, stage: true, value: true, createdAt: true,
            lead: { select: { companyName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        // Clients managed
        managedClients: {
          select: {
            id: true, companyName: true, contactName: true, status: true,
            industry: true, createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        // Projects
        managedProjects: {
          select: {
            id: true, name: true, status: true, budget: true,
            startDate: true, endDate: true, createdAt: true,
            client: { select: { companyName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        createdProjects: {
          select: {
            id: true, name: true, status: true, budget: true,
            startDate: true, endDate: true, createdAt: true,
            client: { select: { companyName: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Build summary stats
    const allLeads = [...new Map([...user.createdLeads, ...user.assignedLeads].map(l => [l.id, l])).values()];
    const allDeals = [...new Map([...user.createdDeals, ...user.assignedDeals].map(d => [d.id, d])).values()];
    const allProjects = [...new Map([...user.managedProjects, ...user.createdProjects].map(p => [p.id, p])).values()];

    // For CLIENT-role users: merge in their company's projects and deals
    let allClients = [...user.managedClients];
    if (user.role === "CLIENT" && user.client) {
      // Add the client's own projects (with client info added)
      const clientProjects = (user.client.projects || []).map(p => ({
        ...p,
        client: { companyName: user.client.companyName },
      }));
      // Merge (dedup with existing)
      const projectMap = new Map(allProjects.map(p => [p.id, p]));
      clientProjects.forEach(p => { if (!projectMap.has(p.id)) projectMap.set(p.id, p); });
      allProjects.splice(0, allProjects.length, ...projectMap.values());

      // Add the client's founding deal
      if (user.client.deal) {
        const dealMap = new Map(allDeals.map(d => [d.id, d]));
        if (!dealMap.has(user.client.deal.id)) {
          dealMap.set(user.client.deal.id, {
            ...user.client.deal,
            lead: { companyName: user.client.companyName },
            createdAt: user.client.createdAt,
          });
        }
        allDeals.splice(0, allDeals.length, ...dealMap.values());
      }

      // Add their own company as a "client" entry
      if (!allClients.find(c => c.id === user.client.id)) {
        allClients.push({
          id: user.client.id,
          companyName: user.client.companyName,
          contactName: user.client.contactName,
          status: user.client.status,
          industry: user.client.industry,
          createdAt: user.client.createdAt,
        });
      }
    }

    const summary = {
      totalLeads: allLeads.length,
      totalDeals: allDeals.length,
      totalClients: allClients.length,
      totalProjects: allProjects.length,
      wonDeals: allDeals.filter(d => d.stage === "WON").length,
      lostDeals: allDeals.filter(d => d.stage === "LOST").length,
      activeClients: allClients.filter(c => c.status === "ACTIVE").length,
      totalDealValue: allDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
      wonDealValue: allDeals.filter(d => d.stage === "WON").reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    };

    return {
      user: {
        id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
        phone: user.phone, avatar: user.avatar, role: user.role, status: user.status,
        isEmailVerified: user.isEmailVerified, lastLoginAt: user.lastLoginAt,
        clientId: user.clientId, client: user.client || null,
        createdAt: user.createdAt, updatedAt: user.updatedAt,
      },
      summary,
      leads: allLeads,
      deals: allDeals,
      clients: allClients,
      projects: allProjects,
    };
  }

  /**
   * Delete a user (soft → set status to INACTIVE, or hard delete)
   */
  async deleteUser(id, requesterId) {
    if (id === requesterId) {
      throw ApiError.badRequest("You cannot delete your own account");
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if(user.role == "OWNER") {
      throw ApiError.badRequest("Users with role OWNER cannot be deleted");
    }

    // Revoke all sessions
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    // Hard delete
    await prisma.user.delete({ where: { id } });
  }
}

export default new UserService();
