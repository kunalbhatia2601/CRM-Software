import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const TEAM_INCLUDE = {
  lead: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatar: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  projectTeams: {
    include: {
      project: { select: { id: true, name: true, status: true } },
    },
  },
  _count: { select: { members: true, projectTeams: true } },
};

const TEAM_LIST_INCLUDE = {
  lead: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
  _count: { select: { members: true, projectTeams: true } },
};

const DEFAULT_PERMISSIONS = {
  tasks: {
    view: true,
    create: false,
    edit: false,
    delete: false,
    review: false,
    approve: false,
    comment: true,
  },
  milestones: {
    view: true,
    create: false,
    edit: false,
    delete: false,
    review: false,
    approve: false,
    comment: true,
  },
  planningSteps: {
    view: true,
    create: false,
    edit: false,
    delete: false,
    review: false,
    approve: false,
    comment: true,
  },
};

class TeamService {
  /**
   * Create a new team with optional members
   */
  async createTeam(data) {
    const { memberIds, ...teamData } = data;

    // Validate lead if provided
    if (teamData.leadId) {
      const lead = await prisma.user.findUnique({
        where: { id: teamData.leadId },
      });
      if (!lead) {
        throw ApiError.badRequest("Lead user not found");
      }
      if (lead.role === "CLIENT") {
        throw ApiError.badRequest("Cannot assign CLIENT role as team lead");
      }
    }

    // Create team and members in transaction
    const team = await prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: teamData,
        include: TEAM_INCLUDE,
      });

      // Add members if provided
      if (memberIds && memberIds.length > 0) {
        const membersData = [];
        for (const userId of memberIds) {
          // Validate user exists
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) {
            throw ApiError.badRequest(`User ${userId} not found`);
          }
          if (user.role === "CLIENT") {
            throw ApiError.badRequest(
              `Cannot add CLIENT role user (${userId}) to team`
            );
          }

          membersData.push({
            teamId: createdTeam.id,
            userId,
            permissions: DEFAULT_PERMISSIONS,
          });
        }

        if (membersData.length > 0) {
          await tx.teamMember.createMany({ data: membersData });
        }
      }

      // Refetch team with members
      return tx.team.findUnique({
        where: { id: createdTeam.id },
        include: TEAM_INCLUDE,
      });
    });

    return team;
  }

  /**
   * List teams with pagination, search, and sort
   */
  async listTeams({ page = 1, limit = 10, search, sortBy = "createdAt", sortOrder = "desc" }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: TEAM_LIST_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.team.count({ where }),
    ]);

    return {
      teams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single team by ID with full details
   */
  async getTeamById(id) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: TEAM_INCLUDE,
    });

    if (!team) {
      throw ApiError.notFound("Team not found");
    }

    return team;
  }

  /**
   * Update team fields
   */
  async updateTeam(id, data) {
    // Check team exists
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw ApiError.notFound("Team not found");
    }

    // Validate lead if provided
    if (data.leadId) {
      const lead = await prisma.user.findUnique({
        where: { id: data.leadId },
      });
      if (!lead) {
        throw ApiError.badRequest("Lead user not found");
      }
      if (lead.role === "CLIENT") {
        throw ApiError.badRequest("Cannot assign CLIENT role as team lead");
      }
    }

    const updated = await prisma.team.update({
      where: { id },
      data,
      include: TEAM_INCLUDE,
    });

    return updated;
  }

  /**
   * Delete team
   */
  async deleteTeam(id) {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw ApiError.notFound("Team not found");
    }

    await prisma.team.delete({ where: { id } });
  }

  /**
   * Add member to team
   */
  async addMember(teamId, userId, permissions) {
    // Validate team exists
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      throw ApiError.notFound("Team not found");
    }

    // Validate user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Check user is not CLIENT
    if (user.role === "CLIENT") {
      throw ApiError.badRequest("Cannot add CLIENT role user to team");
    }

    // Check user is not already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (existingMember) {
      throw ApiError.conflict("User is already a member of this team");
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        permissions: permissions || DEFAULT_PERMISSIONS,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return member;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId, userId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!member) {
      throw ApiError.notFound("Team member not found");
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });
  }

  /**
   * Update member permissions
   */
  async updateMemberPermissions(teamId, userId, permissions) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });

    if (!member) {
      throw ApiError.notFound("Team member not found");
    }

    const updated = await prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { permissions },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get teams dropdown (id and name only)
   */
  async getTeamsDropdown() {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return teams;
  }
}

export default new TeamService();
