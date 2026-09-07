import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

/** Months covered by one cycle, taken from the project's billing cycle. */
const CYCLE_MONTHS = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * First day of the month a date falls in, in UTC.
 *
 * Period boundaries are UTC on purpose. `periodStart` is a `@db.Date` column,
 * which stores only the calendar date and truncates in UTC — so a local
 * midnight in any timezone ahead of UTC (IST is +5:30) would be written as the
 * previous day, and every cycle would come back a month early.
 */
function startOfMonth(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

/** Last day of the period that begins at `start` and runs `months` long. */
function endOfPeriod(start, months) {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 0));
}

/**
 * A readable name for the period.
 * One month reads as "September 2026"; longer spans name both ends.
 */
function labelFor(start, months) {
  const end = endOfPeriod(start, months);
  if (months === 1) return `${MONTH_NAMES[start.getUTCMonth()]} ${start.getUTCFullYear()}`;

  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const from = `${MONTH_NAMES[start.getUTCMonth()]}${sameYear ? "" : ` ${start.getUTCFullYear()}`}`;
  return `${from} – ${MONTH_NAMES[end.getUTCMonth()]} ${end.getUTCFullYear()}`;
}

/** Records that belong to a cycle, and the field each uses to point at one. */
const CYCLE_MODELS = ["milestone", "planningStep", "task"];

class ProjectCycleService {
  /** Cycle length for a project, in months. ONE_TIME projects get a single cycle. */
  async #monthsFor(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, billingCycle: true, startDate: true },
    });
    if (!project) throw ApiError.notFound("Project not found");
    return { project, months: CYCLE_MONTHS[project.billingCycle] || null };
  }

  /**
   * Every cycle on a project, newest first, with how much work sits in each.
   *
   * The counts are what the month switcher shows, so a past period can be
   * opened and reviewed without loading its records first.
   */
  async list(projectId) {
    const { months } = await this.#monthsFor(projectId);

    const cycles = await prisma.projectCycle.findMany({
      where: { projectId },
      orderBy: { periodStart: "desc" },
      include: {
        _count: { select: { milestones: true, planningSteps: true, tasks: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Completed counts need a second pass; _count cannot filter.
    const completed = await prisma.task.groupBy({
      by: ["cycleId"],
      where: { projectId, cycleId: { not: null }, status: "COMPLETED" },
      _count: { id: true },
    });
    const doneByCycle = Object.fromEntries(completed.map((r) => [r.cycleId, r._count.id]));

    return {
      cycles: cycles.map((c) => ({ ...c, completedTasks: doneByCycle[c.id] || 0 })),
      // A one-time project has a single period, so there is no next one to
      // open. The UI hides the control rather than letting it fail.
      canStartNext: !!months,
    };
  }

  /**
   * Where a date falls in a project's calendar of periods.
   *
   * Periods are anchored to the project's start month, so a quarterly retainer
   * that began in February runs Feb–Apr rather than Jan–Mar.
   */
  #periodStartFor(project, months, date) {
    const anchor = startOfMonth(project.startDate || date);
    const target = startOfMonth(date);
    const monthsApart =
      (target.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
      (target.getUTCMonth() - anchor.getUTCMonth());
    const periodIndex = Math.floor(monthsApart / months);
    return new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + periodIndex * months, 1)
    );
  }

  /**
   * The cycle covering a date, or null.
   *
   * Read-only on purpose: opening a project must not create a period. A dormant
   * retainer would otherwise sprout an empty cycle every time someone looked at
   * it, and the board would claim to be showing a month that holds nothing.
   */
  async findCycleFor(projectId, date = new Date()) {
    const { project, months } = await this.#monthsFor(projectId);

    if (!months) {
      return prisma.projectCycle.findFirst({ where: { projectId }, orderBy: { periodStart: "asc" } });
    }

    return prisma.projectCycle.findUnique({
      where: {
        projectId_periodStart: {
          projectId,
          periodStart: this.#periodStartFor(project, months, date),
        },
      },
    });
  }

  /**
   * The cycle covering a date — created if this project has none for it yet.
   *
   * Called when work is created, so a task never lands outside a period.
   */
  async ensureCycleFor(projectId, date = new Date(), userId = null) {
    const { project, months } = await this.#monthsFor(projectId);

    // A one-time project has a single open-ended cycle rather than a calendar.
    if (!months) {
      const existing = await prisma.projectCycle.findFirst({
        where: { projectId },
        orderBy: { periodStart: "asc" },
      });
      if (existing) return existing;

      const start = startOfMonth(project.startDate || date);
      return prisma.projectCycle.create({
        data: {
          projectId,
          label: "Project",
          periodStart: start,
          periodEnd: new Date(Date.UTC(start.getUTCFullYear() + 50, start.getUTCMonth(), 1)),
          createdById: userId,
        },
      });
    }

    const periodStart = this.#periodStartFor(project, months, date);

    const existing = await prisma.projectCycle.findUnique({
      where: { projectId_periodStart: { projectId, periodStart } },
    });
    if (existing) return existing;

    return prisma.projectCycle.create({
      data: {
        projectId,
        label: labelFor(periodStart, months),
        periodStart,
        periodEnd: endOfPeriod(periodStart, months),
        createdById: userId,
      },
    });
  }

  /**
   * The cycle covering today, or null when this project has none yet.
   *
   * The board falls back to showing every period in that case, which is the
   * right view for a project that has never been split into months.
   */
  async current(projectId) {
    return this.findCycleFor(projectId, new Date());
  }

  async getById(id) {
    const cycle = await prisma.projectCycle.findUnique({
      where: { id },
      include: { project: { select: { id: true, name: true, billingCycle: true } } },
    });
    if (!cycle) throw ApiError.notFound("Cycle not found");
    return cycle;
  }

  /**
   * Open the next cycle, optionally copying the previous plan into it.
   *
   * Retainer work repeats, so the structure is copied — titles, descriptions,
   * assignees, costing, ordering and the milestone/step a task hangs off. What
   * is deliberately NOT copied: statuses, dates, completion times, review notes
   * and submissions. A cloned plan is new work, and starting it half-finished
   * would be worse than typing it out.
   *
   * @param {string} projectId
   * @param {object} opts { fromCycleId, clone, carryOverTaskIds }
   */
  async startNext(projectId, { fromCycleId, clone = true, carryOverTaskIds = [] } = {}, userId = null) {
    const { project, months } = await this.#monthsFor(projectId);
    if (!months) throw ApiError.badRequest("A one-time project has a single cycle");

    const latest = await prisma.projectCycle.findFirst({
      where: { projectId },
      orderBy: { periodStart: "desc" },
    });

    // The next period follows the latest one that exists, so opening October
    // early does not skip a month.
    const base = latest ? new Date(latest.periodStart) : startOfMonth(project.startDate || new Date());
    const nextStart = latest
      ? new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1))
      : base;

    const existing = await prisma.projectCycle.findUnique({
      where: { projectId_periodStart: { projectId, periodStart: nextStart } },
    });
    if (existing) throw ApiError.badRequest(`${existing.label} already exists`);

    const source = fromCycleId
      ? await prisma.projectCycle.findFirst({ where: { id: fromCycleId, projectId } })
      : latest;

    const cycle = await prisma.projectCycle.create({
      data: {
        projectId,
        label: labelFor(nextStart, months),
        periodStart: nextStart,
        periodEnd: endOfPeriod(nextStart, months),
        clonedFromId: clone ? source?.id || null : null,
        createdById: userId,
      },
    });

    let copied = { milestones: 0, planningSteps: 0, tasks: 0 };
    if (clone && source) copied = await this.#clonePlan(source.id, cycle.id, projectId, userId);

    // Unfinished work the user chose to bring forward moves cycle, rather than
    // being duplicated — it is the same task, still not done.
    let carried = 0;
    if (carryOverTaskIds.length > 0) {
      const res = await prisma.task.updateMany({
        where: { id: { in: carryOverTaskIds }, projectId, status: { not: "COMPLETED" } },
        data: { cycleId: cycle.id },
      });
      carried = res.count;
    }

    // The period just replaced is done being worked.
    if (source) {
      await prisma.projectCycle.update({ where: { id: source.id }, data: { status: "CLOSED" } });
    }

    return { cycle, copied, carried };
  }

  /**
   * Copy one cycle's plan into another.
   *
   * Milestones and steps are copied first so their new ids are known, then
   * tasks are re-pointed at the copies — otherwise October's tasks would hang
   * off September's milestones.
   */
  async #clonePlan(fromCycleId, toCycleId, projectId, userId) {
    const [milestones, steps, tasks] = await Promise.all([
      prisma.milestone.findMany({ where: { cycleId: fromCycleId }, orderBy: { createdAt: "asc" } }),
      prisma.planningStep.findMany({ where: { cycleId: fromCycleId }, orderBy: { createdAt: "asc" } }),
      prisma.task.findMany({ where: { cycleId: fromCycleId }, orderBy: { createdAt: "asc" } }),
    ]);

    const milestoneMap = {};
    for (const m of milestones) {
      const created = await prisma.milestone.create({
        data: {
          projectId,
          cycleId: toCycleId,
          title: m.title,
          description: m.description,
          status: "PENDING",
        },
      });
      milestoneMap[m.id] = created.id;
    }

    const stepMap = {};
    for (const st of steps) {
      const created = await prisma.planningStep.create({
        data: {
          projectId,
          cycleId: toCycleId,
          title: st.title,
          description: st.description,
          status: "PENDING",
        },
      });
      stepMap[st.id] = created.id;
    }

    for (const t of tasks) {
      await prisma.task.create({
        data: {
          projectId,
          cycleId: toCycleId,
          title: t.title,
          description: t.description,
          objectives: t.objectives,
          deliverables: t.deliverables,
          references: t.references ?? undefined,
          priority: t.priority,
          status: "NEW",
          assigneeId: t.assigneeId,
          assignedById: t.assigneeId ? userId : null,
          createdById: userId || t.createdById,
          milestoneId: t.milestoneId ? milestoneMap[t.milestoneId] || null : null,
          planningStepId: t.planningStepId ? stepMap[t.planningStepId] || null : null,
          internalCostType: t.internalCostType,
          internalCostAmount: t.internalCostAmount,
          position: t.position,
        },
      });
    }

    return { milestones: milestones.length, planningSteps: steps.length, tasks: tasks.length };
  }

  /** Unfinished tasks in a cycle — the candidates for carrying forward. */
  async carryOverCandidates(cycleId) {
    return prisma.task.findMany({
      where: { cycleId, status: { not: "COMPLETED" } },
      select: {
        id: true, title: true, status: true, dueDate: true,
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async remove(id) {
    const cycle = await prisma.projectCycle.findUnique({
      where: { id },
      include: { _count: { select: { milestones: true, planningSteps: true, tasks: true } } },
    });
    if (!cycle) throw ApiError.notFound("Cycle not found");

    const records =
      cycle._count.milestones + cycle._count.planningSteps + cycle._count.tasks;
    if (records > 0) {
      throw ApiError.badRequest(
        `${cycle.label} still holds ${records} record(s). Move or delete them before removing the cycle.`
      );
    }

    await prisma.projectCycle.delete({ where: { id } });
  }
}


export default new ProjectCycleService();
