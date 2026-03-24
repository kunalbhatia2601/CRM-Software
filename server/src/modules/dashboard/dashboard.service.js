import prisma from "../../utils/prisma.js";

/**
 * Fetches aggregated dashboard statistics for the Owner panel.
 * Returns counts for users, leads, deals, clients, projects
 * along with pipeline breakdowns and recent activity.
 */
export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Run all queries in parallel for performance
  const [
    totalUsers,
    activeUsers,
    totalLeads,
    leadsThisMonth,
    leadsLastMonth,
    leadsByStatus,
    totalDeals,
    dealsThisMonth,
    dealsLastMonth,
    dealsByStage,
    totalDealValue,
    wonDealValue,
    totalClients,
    activeClients,
    clientsThisMonth,
    clientsLastMonth,
    totalProjects,
    projectsByStatus,
    projectsThisMonth,
    recentLeads,
    recentDeals,
  ] = await Promise.all([
    // Users
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),

    // Leads
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.lead.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.lead.groupBy({ by: ["status"], _count: { id: true } }),

    // Deals
    prisma.deal.count(),
    prisma.deal.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.deal.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.deal.groupBy({ by: ["stage"], _count: { id: true } }),
    prisma.deal.aggregate({ _sum: { value: true } }),
    prisma.deal.aggregate({ where: { stage: "WON" }, _sum: { value: true } }),

    // Clients
    prisma.client.count(),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.client.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

    // Projects
    prisma.project.count(),
    prisma.project.groupBy({ by: ["status"], _count: { id: true } }),
    prisma.project.count({ where: { createdAt: { gte: startOfMonth } } }),

    // Recent Activity
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
        createdAt: true,
      },
    }),
    prisma.deal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        stage: true,
        value: true,
        createdAt: true,
        lead: {
          select: { companyName: true },
        },
      },
    }),
  ]);

  // Helper to build status/stage maps
  const toMap = (grouped) =>
    grouped.reduce((acc, item) => {
      const key = item.status || item.stage;
      acc[key] = item._count.id;
      return acc;
    }, {});

  // Calculate month-over-month percentage changes
  const calcChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  };

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    leads: {
      total: totalLeads,
      thisMonth: leadsThisMonth,
      lastMonth: leadsLastMonth,
      change: calcChange(leadsThisMonth, leadsLastMonth),
      byStatus: toMap(leadsByStatus),
    },
    deals: {
      total: totalDeals,
      thisMonth: dealsThisMonth,
      lastMonth: dealsLastMonth,
      change: calcChange(dealsThisMonth, dealsLastMonth),
      byStage: toMap(dealsByStage),
      totalValue: totalDealValue._sum.value || 0,
      wonValue: wonDealValue._sum.value || 0,
    },
    clients: {
      total: totalClients,
      active: activeClients,
      thisMonth: clientsThisMonth,
      lastMonth: clientsLastMonth,
      change: calcChange(clientsThisMonth, clientsLastMonth),
    },
    projects: {
      total: totalProjects,
      thisMonth: projectsThisMonth,
      byStatus: toMap(projectsByStatus),
    },
    recentLeads,
    recentDeals,
  };
}
