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
export async function getEmployeeDashboardStats(userId) {
  const now = new Date();

  // Midnight seven days back, so "last 7 days" covers whole days including today.
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);

  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const OPEN_STATUSES = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS", "IN_REVIEW", "CLIENT_REVIEW"];

  const TASK_FIELDS = {
    id: true,
    title: true,
    status: true,
    priority: true,
    dueDate: true,
    completedAt: true,
    updatedAt: true,
    project: { select: { id: true, name: true } },
  };

  const [
    byStatus,
    overdueCount,
    dueSoonCount,
    completedThisWeek,
    assignedThisWeek,
    recentTasks,
    dueSoonTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.task.groupBy({
      by: ["status"],
      where: { assigneeId: userId },
      _count: { id: true },
    }),

    prisma.task.count({
      where: { assigneeId: userId, status: { in: OPEN_STATUSES }, dueDate: { lt: now } },
    }),

    prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: OPEN_STATUSES },
        dueDate: { gte: now, lte: weekAhead },
      },
    }),

    // Raw rows for the 7-day chart — grouping by day is done below, since
    // Prisma cannot truncate a timestamp to a date in groupBy.
    prisma.task.findMany({
      where: { assigneeId: userId, completedAt: { gte: weekStart } },
      select: { completedAt: true },
    }),

    prisma.task.findMany({
      where: { assigneeId: userId, createdAt: { gte: weekStart } },
      select: { createdAt: true },
    }),

    prisma.task.findMany({
      where: { assigneeId: userId },
      take: 8,
      orderBy: { updatedAt: "desc" },
      select: TASK_FIELDS,
    }),

    prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: OPEN_STATUSES },
        dueDate: { gte: now, lte: weekAhead },
      },
      take: 5,
      orderBy: { dueDate: "asc" },
      select: TASK_FIELDS,
    }),

    prisma.task.findMany({
      where: { assigneeId: userId, status: { in: OPEN_STATUSES }, dueDate: { lt: now } },
      take: 5,
      orderBy: { dueDate: "asc" },
      select: TASK_FIELDS,
    }),
  ]);

  const statusCount = (status) => byStatus.find((r) => r.status === status)?._count.id ?? 0;
  const total = byStatus.reduce((sum, r) => sum + r._count.id, 0);

  // Build the seven day buckets, oldest first, so the chart never has gaps.
  const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
  const buckets = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    buckets.push({ date: dayKey(day), completed: 0, assigned: 0 });
  }
  const bucketFor = (d) => buckets.find((b) => b.date === dayKey(d));

  for (const t of completedThisWeek) {
    const b = bucketFor(t.completedAt);
    if (b) b.completed += 1;
  }
  for (const t of assignedThisWeek) {
    const b = bucketFor(t.createdAt);
    if (b) b.assigned += 1;
  }

  return {
    tasks: {
      total,
      new: statusCount("NEW"),
      acknowledged: statusCount("ACKNOWLEDGED"),
      inProgress: statusCount("IN_PROGRESS"),
      inReview: statusCount("IN_REVIEW"),
      clientReview: statusCount("CLIENT_REVIEW"),
      completed: statusCount("COMPLETED"),
      open: OPEN_STATUSES.reduce((sum, st) => sum + statusCount(st), 0),
      overdue: overdueCount,
      dueSoon: dueSoonCount,
    },
    last7Days: buckets,
    weekTotals: {
      completed: completedThisWeek.length,
      assigned: assignedThisWeek.length,
    },
    recentTasks,
    dueSoonTasks,
    overdueTasks,
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

/**
 * Fetches dashboard statistics for an Account Manager.
 * Scoped to clients and projects they manage.
 *
 * @param {string} userId - The account manager's user ID
 */
export async function getAccountDashboardStats(userId) {
  const now = new Date();

  // Get managed project IDs
  const managedProjects = await prisma.project.findMany({
    where: { accountManagerId: userId },
    select: { id: true },
  });
  const pIds = managedProjects.map((p) => p.id);

  const [
    totalClients,
    activeClients,
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    inReviewTasks,
    upcomingMilestones,
    recentDocuments,
    upcomingMeetings,
    clientsList,
    projectsList,
  ] = await Promise.all([
    prisma.client.count({ where: { accountManagerId: userId } }),
    prisma.client.count({ where: { accountManagerId: userId, status: "ACTIVE" } }),

    prisma.project.count({ where: { accountManagerId: userId } }),
    prisma.project.count({ where: { accountManagerId: userId, status: "IN_PROGRESS" } }),

    prisma.task.count({ where: { projectId: { in: pIds } } }),
    prisma.task.count({ where: { projectId: { in: pIds }, status: "COMPLETED" } }),
    prisma.task.count({ where: { projectId: { in: pIds }, status: "IN_REVIEW" } }),

    prisma.milestone.findMany({
      where: { projectId: { in: pIds }, status: { in: ["PENDING", "IN_PROGRESS"] } },
      take: 5,
      orderBy: { dueDate: "asc" },
      select: {
        id: true, title: true, status: true, dueDate: true,
        project: { select: { id: true, name: true } },
      },
    }),

    prisma.document.findMany({
      where: { projectId: { in: pIds } },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, type: true, fileUrl: true, requiresSignature: true, isSigned: true, createdAt: true,
        project: { select: { id: true, name: true } },
      },
    }),

    prisma.meeting.findMany({
      where: { projectId: { in: pIds }, scheduledAt: { gte: now }, status: "SCHEDULED" },
      take: 5,
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true, title: true, mode: true, status: true, scheduledAt: true, duration: true,
        project: { select: { id: true, name: true } },
      },
    }),

    prisma.client.findMany({
      where: { accountManagerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true, companyName: true, contactName: true, status: true,
        _count: { select: { projects: true } },
      },
    }),

    prisma.project.findMany({
      where: { accountManagerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, status: true, startDate: true, endDate: true,
        client: { select: { companyName: true } },
        _count: { select: { tasks: true, milestones: true } },
      },
    }),
  ]);

  return {
    clients: { total: totalClients, active: activeClients },
    projects: { total: totalProjects, active: activeProjects },
    tasks: { total: totalTasks, completed: completedTasks, inReview: inReviewTasks },
    upcomingMilestones,
    recentDocuments,
    upcomingMeetings,
    clientsList,
    projectsList,
  };
}

/**
 * HR / OWNER / ADMIN attendance-focused dashboard.
 * Shows today's attendance snapshot, pending leaves, upcoming holidays.
 */
export async function getHrDashboardStats() {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const in30Days = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 30));

  const [
    totalActiveUsers,
    todayAttendance,
    pendingLeaveCount,
    recentLeaveRequests,
    upcomingHolidays,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE", role: { not: "CLIENT" } } }),
    prisma.attendance.findMany({
      where: { date: todayUtc },
      select: { id: true, status: true, userId: true },
    }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        leaveType: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: todayUtc, lte: in30Days } },
      take: 5,
      orderBy: { date: "asc" },
    }),
  ]);

  // Group today's attendance by status
  const byStatus = todayAttendance.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const presentCount = (byStatus.PRESENT || 0) + (byStatus.WORK_FROM_HOME || 0) + (byStatus.ON_DUTY || 0);
  const halfDayCount = (byStatus.HALF_DAY_FIRST || 0) + (byStatus.HALF_DAY_SECOND || 0);
  const onLeaveCount = byStatus.ON_LEAVE || 0;
  const absentCount = byStatus.ABSENT || 0;
  const notMarkedCount = Math.max(totalActiveUsers - todayAttendance.length, 0);

  return {
    totalActiveUsers,
    today: {
      present: presentCount,
      halfDay: halfDayCount,
      onLeave: onLeaveCount,
      absent: absentCount,
      notMarked: notMarkedCount,
      byStatus,
    },
    pendingLeaveCount,
    recentLeaveRequests,
    upcomingHolidays,
  };
}
