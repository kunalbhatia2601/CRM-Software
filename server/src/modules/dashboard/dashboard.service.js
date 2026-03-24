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
