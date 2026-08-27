import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { computeDerived } from "./metricFormula.js";
import { BACKDATE_DAYS } from "./campaign.validation.js";

const num = (v) => Number(v || 0);

const CAMPAIGN_INCLUDE = {
  type: { select: { id: true, name: true, platform: true, icon: true, metricSchema: true, derivedMetrics: true } },
  project: { select: { id: true, name: true, client: { select: { id: true, companyName: true } } } },
  manager: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

/** Midnight UTC — dates are stored as @db.Date, so time of day is noise. */
function toDay(value) {
  const d = new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Sequential reference: CMP-2026-0001, scoped per year.
 */
async function nextReference(tx) {
  const year = new Date().getFullYear();
  const prefix = `CMP-${year}-`;
  const last = await tx.campaign.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/**
 * Ad budget available on a project for a given month.
 *
 * Funds in (client-paid + agency-allotted) minus what is already committed to
 * campaigns overlapping that period. Carry-forward is deliberately additive:
 * unspent money stays with the project.
 */
export async function getProjectBudget(projectId, year, month) {
  const [ledgers, campaigns] = await Promise.all([
    prisma.adBudgetLedger.findMany({
      where: {
        projectId,
        OR: [{ periodYear: { lt: year } }, { periodYear: year, periodMonth: { lte: month } }],
      },
      include: { entries: true },
    }),
    prisma.campaign.findMany({
      where: { projectId, status: { notIn: ["CANCELLED"] } },
      select: { id: true, budgetAllocated: true },
    }),
  ]);

  let clientPaid = 0;
  let agencyAllotted = 0;
  let tax = 0;
  for (const l of ledgers) {
    for (const e of l.entries) {
      if (e.source === "CLIENT_PAID") clientPaid += num(e.amount);
      else agencyAllotted += num(e.amount);
      tax += num(e.taxAmount);
    }
  }

  const funded = clientPaid + agencyAllotted;
  const allocated = campaigns.reduce((sum, c) => sum + num(c.budgetAllocated), 0);

  // Spend is what daily stats actually record against those campaigns.
  const spendAgg = await prisma.campaignDailyStat.aggregate({
    where: { campaignId: { in: campaigns.map((c) => c.id) } },
    _sum: { spend: true },
  });
  const spent = num(spendAgg._sum.spend);

  return {
    clientPaid,
    agencyAllotted,
    tax,
    funded,
    allocated,
    spent,
    available: funded - allocated,
    unspent: allocated - spent,
  };
}

/** Roll daily rows into totals, then run the type's derived metrics over them. */
function summariseStats(type, stats) {
  const schema = Array.isArray(type?.metricSchema) ? type.metricSchema : [];
  const totals = {};
  for (const f of schema) totals[f.id] = 0;

  let spend = 0;
  for (const s of stats) {
    spend += num(s.spend);
    const m = s.metrics || {};
    for (const f of schema) totals[f.id] += Number(m[f.id]) || 0;
  }

  return {
    spend,
    totals,
    derived: computeDerived(type?.derivedMetrics, { ...totals, spend }),
    days: stats.length,
  };
}

class CampaignService {
  // ─── Types ───────────────────────────────────────────

  async listTypes({ includeInactive = false } = {}) {
    return prisma.campaignType.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async createType(data) {
    return prisma.campaignType.create({ data });
  }

  async updateType(id, data) {
    const existing = await prisma.campaignType.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Campaign type not found");
    return prisma.campaignType.update({ where: { id }, data });
  }

  /** Types in use are deactivated — campaign history must keep its schema. */
  async removeType(id) {
    const used = await prisma.campaign.count({ where: { typeId: id } });
    if (used > 0) {
      return prisma.campaignType.update({ where: { id }, data: { isActive: false } });
    }
    await prisma.campaignType.delete({ where: { id } });
    return null;
  }

  // ─── Campaigns ───────────────────────────────────────

  async create(data, user) {
    const [type, project] = await Promise.all([
      prisma.campaignType.findUnique({ where: { id: data.typeId } }),
      prisma.project.findUnique({ where: { id: data.projectId }, select: { id: true } }),
    ]);
    if (!type || !type.isActive) throw ApiError.badRequest("Campaign type not found");
    if (!project) throw ApiError.badRequest("Project not found");

    const start = toDay(data.startDate);
    const budget = num(data.budgetAllocated);

    if (budget > 0) {
      await this.#assertWithinBudget(data.projectId, start, budget, null);
    }

    return prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          reference: await nextReference(tx),
          name: data.name,
          description: data.description || null,
          typeId: type.id,
          objective: data.objective || "LEAD_GENERATION",
          status: data.status || "DRAFT",
          projectId: project.id,
          startDate: start,
          endDate: data.endDate ? toDay(data.endDate) : null,
          budgetAllocated: budget,
          dailyCap: data.dailyCap ?? null,
          overspendThreshold: data.overspendThreshold ?? null,
          minCplTarget: data.minCplTarget ?? null,
          managerId: data.managerId || user.id,
          createdById: user.id,
        },
      });
      return tx.campaign.findUnique({ where: { id: created.id }, include: CAMPAIGN_INCLUDE });
    });
  }

  /**
   * Allocation is hard-capped by the project's available budget. Enforced here,
   * not only in the UI — otherwise the cap is decoration.
   */
  async #assertWithinBudget(projectId, startDate, requested, excludeCampaignId) {
    const d = toDay(startDate);
    const budget = await getProjectBudget(projectId, d.getUTCFullYear(), d.getUTCMonth() + 1);

    let available = budget.available;
    if (excludeCampaignId) {
      const current = await prisma.campaign.findUnique({
        where: { id: excludeCampaignId },
        select: { budgetAllocated: true },
      });
      // Re-allocating a campaign's own money is not new spend.
      available += num(current?.budgetAllocated);
    }

    if (requested > available) {
      throw ApiError.badRequest(
        `Only ${available.toFixed(2)} is available on this project for that period. ` +
        `Ask finance to release more before allocating ${requested.toFixed(2)}.`
      );
    }
  }

  async list(filters) {
    const { page = 1, limit = 20, status, typeId, projectId, clientId, managerId, search } = filters;

    const where = {};
    if (status) where.status = status;
    if (typeId) where.typeId = typeId;
    if (projectId) where.projectId = projectId;
    if (managerId) where.managerId = managerId;
    if (clientId) where.project = { clientId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: CAMPAIGN_INCLUDE,
        orderBy: { startDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    // Totals per campaign so the list can show spend without a second call.
    const ids = campaigns.map((c) => c.id);
    const [spendRows, leadRows] = await Promise.all([
      prisma.campaignDailyStat.groupBy({
        by: ["campaignId"],
        where: { campaignId: { in: ids } },
        _sum: { spend: true },
      }),
      prisma.lead.groupBy({
        by: ["campaignId"],
        where: { campaignId: { in: ids } },
        _count: { id: true },
      }),
    ]);

    const spendOf = (id) => num(spendRows.find((r) => r.campaignId === id)?._sum.spend);
    const leadsOf = (id) => leadRows.find((r) => r.campaignId === id)?._count.id ?? 0;

    return {
      campaigns: campaigns.map((c) => ({
        ...c,
        budgetAllocated: num(c.budgetAllocated),
        spend: spendOf(c.id),
        leadCount: leadsOf(c.id),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { ...CAMPAIGN_INCLUDE, dailyStats: { orderBy: { date: "asc" } } },
    });
    if (!campaign) throw ApiError.notFound("Campaign not found");

    const summary = summariseStats(campaign.type, campaign.dailyStats);

    return {
      ...campaign,
      budgetAllocated: num(campaign.budgetAllocated),
      summary,
      dailyStats: campaign.dailyStats.map((s) => ({ ...s, spend: num(s.spend) })),
    };
  }

  async update(id, data, user) {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Campaign not found");

    if (data.budgetAllocated !== undefined) {
      const start = data.startDate ? toDay(data.startDate) : existing.startDate;
      await this.#assertWithinBudget(
        data.projectId || existing.projectId,
        start,
        num(data.budgetAllocated),
        id
      );
    }

    const patch = {};
    for (const k of ["name", "description", "objective", "status", "typeId", "projectId", "dailyCap", "overspendThreshold", "minCplTarget", "managerId"]) {
      if (data[k] !== undefined) patch[k] = data[k] === "" ? null : data[k];
    }
    if (data.startDate !== undefined) patch.startDate = toDay(data.startDate);
    if (data.endDate !== undefined) patch.endDate = data.endDate ? toDay(data.endDate) : null;
    if (data.budgetAllocated !== undefined) patch.budgetAllocated = num(data.budgetAllocated);

    await prisma.campaign.update({ where: { id }, data: patch });
    return this.getById(id);
  }

  async remove(id) {
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Campaign not found");
    const stats = await prisma.campaignDailyStat.count({ where: { campaignId: id } });
    if (stats > 0) {
      throw ApiError.badRequest("This campaign has recorded results — cancel it instead of deleting.");
    }
    await prisma.campaign.delete({ where: { id } });
  }

  // ─── Daily stats ─────────────────────────────────────

  /**
   * Record or correct one day. Upsert, because a day may be revised but never
   * duplicated — the unique constraint on (campaignId, date) enforces that.
   */
  async upsertStat(campaignId, data, user) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { type: { select: { metricSchema: true, name: true } } },
    });
    if (!campaign) throw ApiError.notFound("Campaign not found");

    const date = toDay(data.date);
    const today = toDay(new Date());
    const earliest = new Date(today);
    earliest.setUTCDate(earliest.getUTCDate() - BACKDATE_DAYS);

    if (date > today) throw ApiError.badRequest("Results cannot be entered for a future date");
    if (date < earliest) {
      throw ApiError.badRequest(`Results can only be backdated ${BACKDATE_DAYS} days`);
    }
    if (date < toDay(campaign.startDate)) {
      throw ApiError.badRequest("That date is before the campaign started");
    }

    // Only keep metrics the type actually defines — stops stale keys from a
    // changed template lingering in the JSON forever.
    const schema = Array.isArray(campaign.type?.metricSchema) ? campaign.type.metricSchema : [];
    const clean = {};
    for (const f of schema) {
      const v = data.metrics?.[f.id];
      if (v === undefined || v === null || v === "") continue;
      if (Number.isNaN(Number(v))) throw ApiError.badRequest(`${f.label} must be a number`);
      clean[f.id] = Number(v);
    }
    const missing = schema.filter((f) => f.required && clean[f.id] === undefined).map((f) => f.label);
    if (missing.length) throw ApiError.badRequest(`Missing required metrics: ${missing.join(", ")}`);

    const spend = num(data.spend);
    if (campaign.dailyCap && spend > num(campaign.dailyCap)) {
      throw ApiError.badRequest(`Daily spend exceeds this campaign's cap of ${num(campaign.dailyCap)}`);
    }

    await prisma.campaignDailyStat.upsert({
      where: { campaignId_date: { campaignId, date } },
      create: { campaignId, date, metrics: clean, spend, note: data.note || null, enteredById: user.id },
      update: { metrics: clean, spend, note: data.note || null, enteredById: user.id },
    });

    return this.getById(campaignId);
  }

  async listStats(campaignId, { from, to } = {}) {
    const where = { campaignId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = toDay(from);
      if (to) where.date.lte = toDay(to);
    }
    const stats = await prisma.campaignDailyStat.findMany({
      where,
      orderBy: { date: "asc" },
      include: { enteredBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    return stats.map((s) => ({ ...s, spend: num(s.spend) }));
  }

  async removeStat(campaignId, dateStr) {
    const date = toDay(dateStr);
    const existing = await prisma.campaignDailyStat.findUnique({
      where: { campaignId_date: { campaignId, date } },
    });
    if (!existing) throw ApiError.notFound("No results recorded for that date");
    await prisma.campaignDailyStat.delete({ where: { id: existing.id } });
  }

  // ─── Ad budget ledger ────────────────────────────────

  /** Find or create the ledger for one project-month. */
  async #ledgerFor(projectId, year, month) {
    const existing = await prisma.adBudgetLedger.findUnique({
      where: { projectId_periodYear_periodMonth: { projectId, periodYear: year, periodMonth: month } },
    });
    if (existing) return existing;
    return prisma.adBudgetLedger.create({
      data: { projectId, periodYear: year, periodMonth: month },
    });
  }

  /**
   * Money released into a project's ad budget for a period, plus the campaigns
   * drawing on it. Everything the ledger screen needs in one call.
   */
  async ledger(projectId, year, month) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, client: { select: { id: true, companyName: true } } },
    });
    if (!project) throw ApiError.notFound("Project not found");

    const [ledgerRow, campaigns, budget] = await Promise.all([
      prisma.adBudgetLedger.findUnique({
        where: { projectId_periodYear_periodMonth: { projectId, periodYear: year, periodMonth: month } },
        include: {
          entries: {
            orderBy: { createdAt: "desc" },
            include: {
              createdBy: { select: { id: true, firstName: true, lastName: true } },
              approvedBy: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.campaign.findMany({
        where: { projectId, status: { notIn: ["CANCELLED"] } },
        select: {
          id: true, reference: true, name: true, status: true, budgetAllocated: true,
          type: { select: { name: true, icon: true } },
        },
        orderBy: { startDate: "desc" },
      }),
      getProjectBudget(projectId, year, month),
    ]);

    // Spend per campaign, so the screen shows committed vs actually used.
    const spendRows = await prisma.campaignDailyStat.groupBy({
      by: ["campaignId"],
      where: { campaignId: { in: campaigns.map((c) => c.id) } },
      _sum: { spend: true },
    });
    const spendOf = (id) => num(spendRows.find((r) => r.campaignId === id)?._sum.spend);

    return {
      project,
      period: { year, month },
      budget,
      entries: (ledgerRow?.entries || []).map((e) => ({
        ...e,
        amount: num(e.amount),
        taxAmount: num(e.taxAmount),
      })),
      campaigns: campaigns.map((c) => ({
        ...c,
        budgetAllocated: num(c.budgetAllocated),
        spend: spendOf(c.id),
      })),
    };
  }

  /**
   * Release funds into a project's ad budget.
   *
   * Client payments and agency allotments live side by side, tagged by source,
   * so how much the agency has subsidised is always answerable.
   */
  async addEntry(projectId, data, user) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) throw ApiError.notFound("Project not found");

    const now = new Date();
    const year = data.periodYear || now.getFullYear();
    const month = data.periodMonth || now.getMonth() + 1;

    const ledgerRow = await this.#ledgerFor(projectId, year, month);

    await prisma.adBudgetEntry.create({
      data: {
        ledgerId: ledgerRow.id,
        source: data.source,
        amount: num(data.amount),
        taxAmount: num(data.taxAmount),
        note: data.note || null,
        reference: data.reference || null,
        // Releasing money is a decision, so it is attributable to a person.
        approvedById: user.id,
        approvedAt: new Date(),
        createdById: user.id,
      },
    });

    return this.ledger(projectId, year, month);
  }

  /**
   * Remove a funding entry. Refused when it would drop available below what is
   * already committed to campaigns — you cannot un-fund money already spent.
   */
  async removeEntry(entryId, user) {
    const entry = await prisma.adBudgetEntry.findUnique({
      where: { id: entryId },
      include: { ledger: true },
    });
    if (!entry) throw ApiError.notFound("Entry not found");

    const { projectId, periodYear, periodMonth } = entry.ledger;
    const budget = await getProjectBudget(projectId, periodYear, periodMonth);

    if (budget.funded - num(entry.amount) < budget.allocated) {
      throw ApiError.badRequest(
        "Removing this would leave less funding than is already allocated to campaigns. " +
        "Reduce campaign allocations first."
      );
    }

    await prisma.adBudgetEntry.delete({ where: { id: entryId } });
    return this.ledger(projectId, periodYear, periodMonth);
  }

  /**
   * Every project holding ad budget, for the overview screen.
   * Only projects with funding or campaigns are worth listing.
   */
  async budgetOverview(year, month) {
    const [ledgers, campaigns] = await Promise.all([
      prisma.adBudgetLedger.findMany({
        where: { OR: [{ periodYear: { lt: year } }, { periodYear: year, periodMonth: { lte: month } }] },
        select: { projectId: true },
        distinct: ["projectId"],
      }),
      prisma.campaign.findMany({
        where: { status: { notIn: ["CANCELLED"] } },
        select: { projectId: true },
        distinct: ["projectId"],
      }),
    ]);

    const projectIds = [...new Set([
      ...ledgers.map((l) => l.projectId),
      ...campaigns.map((c) => c.projectId),
    ])];
    if (projectIds.length === 0) return [];

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, client: { select: { id: true, companyName: true } } },
      orderBy: { name: "asc" },
    });

    const rows = await Promise.all(
      projects.map(async (p) => ({
        project: p,
        budget: await getProjectBudget(p.id, year, month),
      }))
    );

    return rows;
  }

  /** Budget position for a project, for the ad-budget screen. */
  async projectBudget(projectId, year, month) {
    const now = new Date();
    return getProjectBudget(
      projectId,
      year || now.getFullYear(),
      month || now.getMonth() + 1
    );
  }
}

export default new CampaignService();
