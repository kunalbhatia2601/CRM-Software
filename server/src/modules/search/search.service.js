import prisma from "../../utils/prisma.js";

class SearchService {
  /**
   * Global search across all entities.
   * Returns max `limit` items per category, only id + display fields.
   */
  async globalSearch(query, limit = 5) {
    const search = query?.trim();
    if (!search) return this.#emptyResult();

    const contains = { contains: search, mode: "insensitive" };

    const [users, leads, deals, clients, projects, teams, services] =
      await Promise.all([
        // ── Users ──
        prisma.user.findMany({
          where: {
            OR: [
              { firstName: contains },
              { lastName: contains },
              { email: contains },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        }),

        // ── Leads ──
        prisma.lead.findMany({
          where: {
            OR: [
              { companyName: contains },
              { contactName: contains },
              { email: contains },
            ],
          },
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
            priority: true,
            estimatedValue: true,
            source: true,
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        }),

        // ── Deals ──
        prisma.deal.findMany({
          where: {
            OR: [
              { title: contains },
              { lead: { companyName: contains } },
              { lead: { contactName: contains } },
            ],
          },
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
            lead: { select: { companyName: true } },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        }),

        // ── Clients ──
        prisma.client.findMany({
          where: {
            OR: [
              { companyName: contains },
              { contactName: contains },
              { email: contains },
            ],
          },
          select: {
            id: true,
            companyName: true,
            contactName: true,
            status: true,
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        }),

        // ── Projects ──
        prisma.project.findMany({
          where: {
            OR: [
              { name: contains },
              { client: { companyName: contains } },
            ],
          },
          select: {
            id: true,
            name: true,
            status: true,
            client: { select: { companyName: true } },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        }),

        // ── Teams ──
        prisma.team.findMany({
          where: { name: contains },
          select: {
            id: true,
            name: true,
            _count: { select: { members: true } },
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        }),

        // ── Services ──
        prisma.service.findMany({
          where: { name: contains },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);

    return {
      users,
      leads,
      deals,
      clients,
      projects,
      teams,
      services,
      counts: {
        users: users.length,
        leads: leads.length,
        deals: deals.length,
        clients: clients.length,
        projects: projects.length,
        teams: teams.length,
        services: services.length,
        total:
          users.length +
          leads.length +
          deals.length +
          clients.length +
          projects.length +
          teams.length +
          services.length,
      },
    };
  }

  #emptyResult() {
    return {
      users: [],
      leads: [],
      deals: [],
      clients: [],
      projects: [],
      teams: [],
      services: [],
      counts: {
        users: 0,
        leads: 0,
        deals: 0,
        clients: 0,
        projects: 0,
        teams: 0,
        services: 0,
        total: 0,
      },
    };
  }
}

export default new SearchService();
