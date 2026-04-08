import prisma from "./prisma.js";
import { ApiError } from "./apiError.js";

/**
 * Project Permission Helper
 *
 * Checks whether a user has a specific permission on a project's tasks or milestones.
 * Permission hierarchy:
 *   1. OWNER / ADMIN → always full access
 *   2. Project Account Manager → always full access
 *   3. Team Lead (of a team assigned to the project) → always full access
 *   4. Team Member → based on their `permissions` JSON in TeamMember table
 *
 * @param {string} userId
 * @param {string} projectId
 * @param {"tasks"|"milestones"|"planningSteps"} resource
 * @param {"view"|"create"|"edit"|"delete"|"review"|"approve"|"comment"} action
 * @returns {Promise<boolean>}
 */
export async function checkProjectPermission(userId, projectId, resource, action) {
  // 1. Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) return false;

  // OWNER and ADMIN always have full access
  if (["OWNER", "ADMIN"].includes(user.role)) return true;

  // 2. Check if user is the project's account manager
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { accountManagerId: true },
  });

  if (!project) return false;
  if (project.accountManagerId === userId) return true;

  // 3. Get all teams assigned to this project
  const projectTeams = await prisma.projectTeam.findMany({
    where: { projectId },
    select: {
      team: {
        select: {
          id: true,
          leadId: true,
        },
      },
    },
  });

  const teamIds = projectTeams.map((pt) => pt.team.id);

  // Check if user is a team lead of any assigned team
  const isTeamLead = projectTeams.some((pt) => pt.team.leadId === userId);
  if (isTeamLead) return true;

  // 4. Check team member permissions
  const membership = await prisma.teamMember.findFirst({
    where: {
      userId,
      teamId: { in: teamIds },
    },
    select: { permissions: true },
  });

  if (!membership) return false;

  // Check the specific permission
  const permissions = membership.permissions || {};
  return !!(permissions[resource]?.[action]);
}

/**
 * Middleware-style helper: throws 403 if the user lacks permission.
 */
export async function requireProjectPermission(userId, projectId, resource, action) {
  const allowed = await checkProjectPermission(userId, projectId, resource, action);
  if (!allowed) {
    throw ApiError.forbidden(
      `You do not have '${action}' permission for ${resource} on this project`
    );
  }
}

/**
 * Get all assignable users for a project — members of all teams assigned to the project.
 * Returns user details for task assignment dropdowns.
 */
export async function getProjectAssignableUsers(projectId) {
  const projectTeams = await prisma.projectTeam.findMany({
    where: { projectId },
    select: { teamId: true },
  });

  const teamIds = projectTeams.map((pt) => pt.teamId);
  if (teamIds.length === 0) return [];

  // Fetch teams with name, lead, and members
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true,
      name: true,
      leadId: true,
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
        },
      },
      members: {
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
    },
  });

  // Deduplicate by user ID and collect teams per user
  const userMap = new Map();

  for (const team of teams) {
    const teamInfo = { id: team.id, name: team.name };

    // Add members
    for (const m of team.members) {
      const existing = userMap.get(m.user.id);
      if (existing) {
        existing.teams.push(teamInfo);
      } else {
        userMap.set(m.user.id, { ...m.user, teams: [teamInfo] });
      }
    }

    // Add team lead
    if (team.lead) {
      const existing = userMap.get(team.lead.id);
      if (existing) {
        if (!existing.teams.some((t) => t.id === team.id)) {
          existing.teams.push(teamInfo);
        }
      } else {
        userMap.set(team.lead.id, { ...team.lead, teams: [teamInfo] });
      }
    }
  }

  return Array.from(userMap.values());
}
