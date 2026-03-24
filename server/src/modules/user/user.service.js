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

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: data.role,
        status: data.status || "ACTIVE",
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

    // If email is being changed, check for duplicates
    if (data.email && data.email !== user.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailTaken) {
        throw ApiError.conflict("A user with this email already exists");
      }
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

    const summary = {
      totalLeads: allLeads.length,
      totalDeals: allDeals.length,
      totalClients: user.managedClients.length,
      totalProjects: allProjects.length,
      wonDeals: allDeals.filter(d => d.stage === "WON").length,
      lostDeals: allDeals.filter(d => d.stage === "LOST").length,
      activeClients: user.managedClients.filter(c => c.status === "ACTIVE").length,
      totalDealValue: allDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
      wonDealValue: allDeals.filter(d => d.stage === "WON").reduce((sum, d) => sum + (Number(d.value) || 0), 0),
    };

    return {
      user: {
        id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName,
        phone: user.phone, avatar: user.avatar, role: user.role, status: user.status,
        isEmailVerified: user.isEmailVerified, lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt, updatedAt: user.updatedAt,
      },
      summary,
      leads: allLeads,
      deals: allDeals,
      clients: user.managedClients,
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

    // Revoke all sessions
    await prisma.refreshToken.deleteMany({ where: { userId: id } });

    // Hard delete
    await prisma.user.delete({ where: { id } });
  }
}

export default new UserService();
