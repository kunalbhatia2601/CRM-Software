import prisma from "../../utils/prisma.js";

/**
 * Computes start/end date boundaries for the current and previous periods.
 *
 * Periods:
 *   "all"   → Everything till date (no comparison)
 *   "year"  → This calendar year vs previous year
 *   "today" → Today vs yesterday
 *   "month" → This calendar month vs previous month (default)
 */
function getPeriodBounds(period) {
  const now = new Date();

  switch (period) {
    case "all":
      return {
        current: {},
        previous: null, // no comparison
        label: "Till Date",
      };

    case "year": {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return {
        current: { gte: startOfYear },
        previous: { gte: startOfLastYear, lte: endOfLastYear },
        label: `${now.getFullYear()}`,
      };
    }

    case "today": {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      return {
        current: { gte: startOfToday },
        previous: { gte: startOfYesterday, lte: endOfYesterday },
        label: "Today",
      };
    }

    case "month":
    default: {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return {
        current: { gte: startOfMonth },
        previous: { gte: startOfLastMonth, lte: endOfLastMonth },
        label: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      };
    }
  }
}

/**
 * Fetches aggregated dashboard statistics for the Owner panel.
 *
 * @param {string} period – "all" | "year" | "today" | "month"
 */
export async function getDashboardStats(period = "month") {
  const bounds = getPeriodBounds(period);
  const { current, previous } = bounds;

  // Build a date filter for Prisma where clauses
  const dateWhere = Object.keys(current).length > 0 ? { createdAt: current } : {};
  const prevDateWhere = previous ? { createdAt: previous } : null;

  // ─── Build all queries in parallel ──────────────────────────

  const queries = [
    // 0-1: Users (always all-time — they're a roster, not events)
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),

    // 2-4: Leads — current period
    prisma.lead.count({ where: dateWhere }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { id: true },
      ...(Object.keys(dateWhere).length > 0 ? { where: dateWhere } : {}),
    }),

    // 5-9: Deals — current period
    prisma.deal.count({ where: dateWhere }),
    prisma.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
      ...(Object.keys(dateWhere).length > 0 ? { where: dateWhere } : {}),
    }),
    prisma.deal.aggregate({
      _sum: { value: true },
      ...(Object.keys(dateWhere).length > 0 ? { where: dateWhere } : {}),
    }),
    prisma.deal.aggregate({
      _sum: { value: true },
      where: { stage: "WON", ...dateWhere },
    }),

    // 8-9: Clients — current period new + always-all active
    prisma.client.count({ where: dateWhere }),
    prisma.client.count({ where: { status: "ACTIVE" } }),

    // 10-11: Projects — current period
    prisma.project.count({ where: dateWhere }),
    prisma.project.groupBy({
      by: ["status"],
      _count: { id: true },
      ...(Object.keys(dateWhere).length > 0 ? { where: dateWhere } : {}),
    }),

    // 12-13: Recent activity (always last 5)
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      ...(Object.keys(dateWhere).length > 0 ? { where: dateWhere } : {}),
      select: {
        id: true,
        companyName: true,
        contactName: true,
        status: true,
        priority: true,
        estimatedValue: true,
        createdAt: true,
      },
    }),
    prisma.deal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      ...(Object.keys(dateWhere).length > 0 ? { where: dateWhere } : {}),
      select: {
        id: true,
        title: true,
        stage: true,
        value: true,
        createdAt: true,
        lead: { select: { companyName: true } },
      },
    }),
  ];

  // If we have a comparison period, add previous-period queries
  if (prevDateWhere) {
    queries.push(
      // 14: Previous leads
      prisma.lead.count({ where: prevDateWhere }),
      // 15: Previous deals
      prisma.deal.count({ where: prevDateWhere }),
      // 16: Previous clients
      prisma.client.count({ where: prevDateWhere }),
      // 17: Previous projects
      prisma.project.count({ where: prevDateWhere }),
      // 18: Previous won deal value
      prisma.deal.aggregate({
        _sum: { value: true },
        where: { stage: "WON", ...prevDateWhere },
      }),
    );
  }

  const results = await Promise.all(queries);

  // Destructure results
  const [
    totalUsers,
    activeUsers,
    totalLeads,
    leadsByStatus,
    totalDeals,
    dealsByStage,
    totalDealValue,
    wonDealValue,
    totalClients,
    activeClients,
    totalProjects,
    projectsByStatus,
    recentLeads,
    recentDeals,
  ] = results;

  // Previous period values (only if comparison exists)
  const prevLeads = prevDateWhere ? results[14] : null;
  const prevDeals = prevDateWhere ? results[15] : null;
  const prevClients = prevDateWhere ? results[16] : null;
  const prevProjects = prevDateWhere ? results[17] : null;
  const prevWonValue = prevDateWhere ? results[18] : null;

  // ─── Helpers ────────────────────────────────────────────────

  const toMap = (grouped) =>
    grouped.reduce((acc, item) => {
      const key = item.status || item.stage;
      acc[key] = item._count.id;
      return acc;
    }, {});

  const calcChange = (current, previous) => {
    if (previous === null || previous === undefined) return null;
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  };

  // ─── Response ───────────────────────────────────────────────

  return {
    period,
    periodLabel: bounds.label,
    hasComparison: !!prevDateWhere,
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    leads: {
      total: totalLeads,
      previous: prevLeads,
      change: calcChange(totalLeads, prevLeads),
      byStatus: toMap(leadsByStatus),
    },
    deals: {
      total: totalDeals,
      previous: prevDeals,
      change: calcChange(totalDeals, prevDeals),
      byStage: toMap(dealsByStage),
      totalValue: totalDealValue._sum.value || 0,
      wonValue: wonDealValue._sum.value || 0,
      prevWonValue: prevWonValue?._sum?.value || 0,
      wonValueChange: calcChange(
        Number(wonDealValue._sum.value || 0),
        prevWonValue ? Number(prevWonValue._sum.value || 0) : null
      ),
    },
    clients: {
      total: totalClients,
      active: activeClients,
      previous: prevClients,
      change: calcChange(totalClients, prevClients),
    },
    projects: {
      total: totalProjects,
      previous: prevProjects,
      change: calcChange(totalProjects, prevProjects),
      byStatus: toMap(projectsByStatus),
    },
    recentLeads,
    recentDeals,
  };
}

/**
 * Fetches dashboard statistics scoped to a specific client company.
 *
 * @param {string} clientId – The client company ID
 */
export async function getClientDashboardStats(clientId) {
  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    projectIds,
    recentDocuments,
    upcomingMeetings,
  ] = await Promise.all([
    // Total projects for this client
    prisma.project.count({ where: { clientId } }),

    // Active projects (IN_PROGRESS)
    prisma.project.count({ where: { clientId, status: "IN_PROGRESS" } }),

    // All project IDs for this client (needed for task/milestone queries)
    prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    }),

    // Recent documents across client's projects
    prisma.document.findMany({
      where: {
        project: { clientId },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        type: true,
        fileUrl: true,
        requiresSignature: true,
        isSigned: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
      },
    }),

    // Upcoming meetings linked to client's projects
    prisma.meeting.findMany({
      where: {
        project: { clientId },
        scheduledAt: { gte: now },
        status: { in: ["SCHEDULED"] },
      },
      take: 5,
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        title: true,
        mode: true,
        status: true,
        scheduledAt: true,
        duration: true,
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  const pIds = projectIds.map((p) => p.id);

  // Task and milestone queries scoped to client projects
  const [
    totalTasks,
    completedTasks,
    reviewTasks,
    upcomingMilestones,
    projectsList,
  ] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: pIds } } }),
    prisma.task.count({ where: { projectId: { in: pIds }, status: "COMPLETED" } }),
    prisma.task.count({ where: { projectId: { in: pIds }, status: "IN_REVIEW" } }),

    // Upcoming milestones
    prisma.milestone.findMany({
      where: {
        projectId: { in: pIds },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
      },
    }),

    // Projects with status for overview
    prisma.project.findMany({
      where: { clientId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: { select: { tasks: true, milestones: true } },
      },
    }),
  ]);

  return {
    projects: {
      total: totalProjects,
      active: activeProjects,
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      inReview: reviewTasks,
    },
    upcomingMilestones,
    recentDocuments,
    upcomingMeetings,
    projectsList,
  };
}

/**
 * Fetches dashboard statistics scoped to an employee user (via team membership).
 *
 * @param {string} userId – The employee user ID
 * @param {string[]} projectIds – Pre-resolved project IDs from getUserProjectIds()
 */
export async function getEmployeeDashboardStats(userId, projectIds) {
  const now = new Date();
  const pIds = projectIds;

  const [
    totalProjects,
    activeProjects,
    myTotalTasks,
    myTodoTasks,
    myInProgressTasks,
    myInReviewTasks,
    myCompletedTasks,
    upcomingMilestones,
    recentTasks,
    upcomingMeetings,
    projectsList,
  ] = await Promise.all([
    // Project counts
    prisma.project.count({ where: { id: { in: pIds } } }),
    prisma.project.count({ where: { id: { in: pIds }, status: "IN_PROGRESS" } }),

    // Tasks assigned to this user
    prisma.task.count({ where: { assigneeId: userId } }),
    prisma.task.count({ where: { assigneeId: userId, status: "TODO" } }),
    prisma.task.count({ where: { assigneeId: userId, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { assigneeId: userId, status: "IN_REVIEW" } }),
    prisma.task.count({ where: { assigneeId: userId, status: { in: ["COMPLETED", "REVIEWED"] } } }),

    // Upcoming milestones from assigned projects
    prisma.milestone.findMany({
      where: {
        projectId: { in: pIds },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
      },
    }),

    // Recent tasks assigned to user (last updated)
    prisma.task.findMany({
      where: { assigneeId: userId },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
      },
    }),

    // Upcoming meetings from assigned projects
    prisma.meeting.findMany({
      where: {
        projectId: { in: pIds },
        scheduledAt: { gte: now },
        status: "SCHEDULED",
      },
      take: 5,
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        title: true,
        mode: true,
        status: true,
        scheduledAt: true,
        duration: true,
        project: { select: { id: true, name: true } },
      },
    }),

    // Projects overview
    prisma.project.findMany({
      where: { id: { in: pIds } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        _count: { select: { tasks: true, milestones: true } },
      },
    }),
  ]);

  return {
    projects: { total: totalProjects, active: activeProjects },
    tasks: {
      total: myTotalTasks,
      todo: myTodoTasks,
      inProgress: myInProgressTasks,
      inReview: myInReviewTasks,
      completed: myCompletedTasks,
    },
    upcomingMilestones,
    recentTasks,
    upcomingMeetings,
    projectsList,
  };
}

/**
 * Fetches dashboard statistics for a Sales Manager.
 * Shows the full sales pipeline: leads, deals, conversions, follow-ups, meetings.
 */
export async function getSalesDashboardStats() {
  const now = new Date();

  const [
    totalLeads,
    leadsByStatus,
    totalDeals,
    dealsByStage,
    totalDealValue,
    wonDealValue,
    wonDealsCount,
    recentLeads,
    recentDeals,
    upcomingFollowUps,
    upcomingMeetings,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.deal.count(),
    prisma.deal.groupBy({
      by: ["stage"],
      _count: { id: true },
    }),
    prisma.deal.aggregate({ _sum: { value: true } }),
    prisma.deal.aggregate({ _sum: { value: true }, where: { stage: "WON" } }),
    prisma.deal.count({ where: { stage: "WON" } }),

    // Recent leads
    prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        status: true,
        priority: true,
        estimatedValue: true,
        source: true,
        createdAt: true,
      },
    }),

    // Recent deals
    prisma.deal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        stage: true,
        value: true,
        createdAt: true,
        lead: { select: { companyName: true } },
      },
    }),

    // Upcoming follow-ups
    prisma.followUp.findMany({
      where: {
        status: { in: ["PENDING", "OVERDUE"] },
        dueAt: { gte: now },
      },
      take: 5,
      orderBy: { dueAt: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        dueAt: true,
        lead: { select: { id: true, companyName: true } },
      },
    }),

    // Upcoming meetings (linked to leads or deals)
    prisma.meeting.findMany({
      where: {
        scheduledAt: { gte: now },
        status: "SCHEDULED",
        OR: [{ leadId: { not: null } }, { dealId: { not: null } }],
      },
      take: 5,
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        title: true,
        mode: true,
        status: true,
        scheduledAt: true,
        duration: true,
        lead: { select: { id: true, companyName: true } },
        deal: { select: { id: true, title: true } },
      },
    }),
  ]);

  const toMap = (grouped) =>
    grouped.reduce((acc, item) => {
      const key = item.status || item.stage;
      acc[key] = item._count.id;
      return acc;
    }, {});

  const conversionRate = totalDeals > 0
    ? parseFloat(((wonDealsCount / totalDeals) * 100).toFixed(1))
    : 0;

  return {
    leads: {
      total: totalLeads,
      byStatus: toMap(leadsByStatus),
    },
    deals: {
      total: totalDeals,
      byStage: toMap(dealsByStage),
      totalValue: totalDealValue._sum.value || 0,
      wonValue: wonDealValue._sum.value || 0,
      wonCount: wonDealsCount,
      conversionRate,
    },
    recentLeads,
    recentDeals,
    upcomingFollowUps,
    upcomingMeetings,
  };
}
