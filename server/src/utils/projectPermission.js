import prisma from "./prisma.js";
import { ApiError } from "./apiError.js";

/**
 * Project Permission Helper
 *
 * Checks whether a user has a specific permission on a project's tasks or milestones.
 * Permission hierarchy:
 *   1. OWNER / ADMIN / ACCOUNT_MANAGER / FINANCE_MANAGER → always full access
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

  // Roles that manage delivery across the whole agency get full access to every
  // project's plan, regardless of which project they are attached to.
  if (["OWNER", "ADMIN", "ACCOUNT_MANAGER", "FINANCE_MANAGER"].includes(user.role)) return true;

  // 2. Check if user is the project's account manager
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { accountManagerId: true, clientId: true },
  });

  if (!project) return false;
  if (project.accountManagerId === userId) return true;

  // 2.5 CLIENT user whose company owns the project → view + comment only
  if (user.role === "CLIENT") {
    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { clientId: true },
    });
    if (fullUser?.clientId && fullUser.clientId === project.clientId) {
      if (["view", "comment"].includes(action)) return true;
    }
    return false;
  }

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

/** True when the user is a CLIENT user of the company that owns this project. */
async function isProjectClient(userId, projectId) {
  const [user, project] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true, clientId: true } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true } }),
  ]);
  return !!(user?.role === "CLIENT" && user.clientId && project && user.clientId === project.clientId);
}

/**
 * May the user pull someone else's task INTO review?
 *
 * Backed by the `tasks.review` team permission, so a senior member can gather
 * work for checking without being made team lead.
 */
export async function canReviewTasks(userId, projectId) {
  return checkProjectPermission(userId, projectId, "tasks", "review");
}

/**
 * May the user move a task OUT of review — sign it off, pass it to the client,
 * or send it back for rework?
 *
 * Backed by the `tasks.approve` team permission, plus the project's client, who
 * signs off on CLIENT_REVIEW work.
 */
export async function canApproveTasks(userId, projectId) {
  if (await isProjectClient(userId, projectId)) return true;
  return checkProjectPermission(userId, projectId, "tasks", "approve");
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

/**
 * Get all project IDs that a user has access to via team membership or team lead role.
 * Used to scope queries for EMPLOYEE role users.
 *
 * @param {string} userId
 * @returns {Promise<string[]>} Array of project IDs
 */
export async function getUserProjectIds(userId) {
  // Get teams where user is a member
  const memberTeams = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  // Get teams where user is a lead
  const ledTeams = await prisma.team.findMany({
    where: { leadId: userId },
    select: { id: true },
  });

  const allTeamIds = [...new Set([
    ...memberTeams.map((m) => m.teamId),
    ...ledTeams.map((t) => t.id),
  ])];

  if (allTeamIds.length === 0) return [];

  const projectTeams = await prisma.projectTeam.findMany({
    where: { teamId: { in: allTeamIds } },
    select: { projectId: true },
  });

  return [...new Set(projectTeams.map((pt) => pt.projectId))];
}

/**
 * Resolve everything a user may do on one project, in a single pass.
 *
 * `checkProjectPermission` answers one question per call and re-queries each
 * time; the UI needs the whole map to decide which controls to render, so this
 * loads the inputs once and derives the rest.
 *
 * @param {string} userId
 * @param {string} projectId
 * @returns {Promise<object>} capability map
 */
export async function getProjectCapabilities(userId, projectId) {
  const RESOURCES = ["tasks", "milestones", "planningSteps"];
  const ACTIONS = ["view", "create", "edit", "delete", "review", "approve", "comment"];

  const none = () =>
    Object.fromEntries(
      RESOURCES.map((r) => [r, Object.fromEntries(ACTIONS.map((a) => [a, false]))])
    );

  const all = () =>
    Object.fromEntries(
      RESOURCES.map((r) => [r, Object.fromEntries(ACTIONS.map((a) => [a, true]))])
    );

  const [user, project] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, clientId: true } }),
    prisma.project.findUnique({ where: { id: projectId }, select: { accountManagerId: true, clientId: true } }),
  ]);

  if (!user || !project) {
    return { ...none(), canReview: false, canApprove: false, isTeamLead: false, isManager: false };
  }

  // Same list as checkProjectPermission — full plan access by role.
  const isManagerRole = ["OWNER", "ADMIN", "ACCOUNT_MANAGER", "FINANCE_MANAGER"].includes(user.role);
  const isAccountManager = project.accountManagerId === userId;

  if (isManagerRole || isAccountManager) {
    return { ...all(), canReview: true, canApprove: true, isTeamLead: false, isManager: true };
  }

  // Client of this project: read + comment only.
  if (user.role === "CLIENT") {
    const ownsProject = user.clientId && user.clientId === project.clientId;
    if (!ownsProject) {
      return { ...none(), canReview: false, canApprove: false, isTeamLead: false, isManager: false };
    }

    const caps = none();
    for (const r of RESOURCES) {
      caps[r].view = true;
      caps[r].comment = true;
    }
    // The client signs off on their own work but never pulls tasks into review.
    caps.tasks.approve = true;
    return { ...caps, canReview: false, canApprove: true, isTeamLead: false, isManager: false };
  }

  const projectTeams = await prisma.projectTeam.findMany({
    where: { projectId },
    select: { team: { select: { id: true, leadId: true } } },
  });

  const isTeamLead = projectTeams.some((pt) => pt.team.leadId === userId);
  if (isTeamLead) {
    return { ...all(), canReview: true, canApprove: true, isTeamLead: true, isManager: true };
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId, teamId: { in: projectTeams.map((pt) => pt.team.id) } },
    select: { permissions: true },
  });

  if (!membership) {
    return { ...none(), canReview: false, canApprove: false, isTeamLead: false, isManager: false };
  }

  const granted = membership.permissions || {};
  const caps = none();
  for (const r of RESOURCES) {
    for (const a of ACTIONS) {
      caps[r][a] = !!granted[r]?.[a];
    }
  }
  return {
    ...caps,
    canReview: caps.tasks.review,
    canApprove: caps.tasks.approve,
    isTeamLead: false,
    isManager: false,
  };
}
