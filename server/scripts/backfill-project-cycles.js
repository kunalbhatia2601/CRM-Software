/**
 * Puts every existing milestone, planning step and task into a delivery cycle.
 *
 * Period is derived from the record's own dates — dueDate first, then startDate,
 * then createdAt — so work already scheduled for a month lands in that month
 * rather than in whichever month the backfill happens to run.
 *
 * Idempotent: records that already have a cycle are skipped, and cycles are
 * looked up before being created.
 *
 * Run: bun scripts/backfill-project-cycles.js          (report only)
 *      bun scripts/backfill-project-cycles.js --write
 */
import prisma from "../src/utils/prisma.js";
import cycleService from "../src/modules/project-cycle/project-cycle.service.js";

const write = process.argv.includes("--write");

const projects = await prisma.project.findMany({
  select: { id: true, name: true, billingCycle: true, startDate: true },
});

let totalRecords = 0;
let totalCycles = 0;

for (const project of projects) {
  const [milestones, steps, tasks] = await Promise.all([
    prisma.milestone.findMany({
      where: { projectId: project.id, cycleId: null },
      select: { id: true, dueDate: true, createdAt: true },
    }),
    prisma.planningStep.findMany({
      where: { projectId: project.id, cycleId: null },
      select: { id: true, startDate: true, createdAt: true },
    }),
    prisma.task.findMany({
      where: { projectId: project.id, cycleId: null },
      select: { id: true, dueDate: true, createdAt: true },
    }),
  ]);

  const count = milestones.length + steps.length + tasks.length;
  if (count === 0) continue;

  const buckets = new Map(); // cycleId -> { milestones: [], steps: [], tasks: [] }
  const cycleIds = new Set();

  /** Resolve (and create, when writing) the cycle a record belongs to. */
  const assign = async (kind, record, date) => {
    if (!write) return;
    const cycle = await cycleService.ensureCycleFor(project.id, date || record.createdAt);
    cycleIds.add(cycle.id);

    if (!buckets.has(cycle.id)) buckets.set(cycle.id, { milestones: [], steps: [], tasks: [] });
    buckets.get(cycle.id)[kind].push(record.id);
  };

  for (const m of milestones) await assign("milestones", m, m.dueDate);
  for (const st of steps) await assign("steps", st, st.startDate);
  for (const t of tasks) await assign("tasks", t, t.dueDate);

  if (write) {
    for (const [cycleId, group] of buckets) {
      if (group.milestones.length) {
        await prisma.milestone.updateMany({ where: { id: { in: group.milestones } }, data: { cycleId } });
      }
      if (group.steps.length) {
        await prisma.planningStep.updateMany({ where: { id: { in: group.steps } }, data: { cycleId } });
      }
      if (group.tasks.length) {
        await prisma.task.updateMany({ where: { id: { in: group.tasks } }, data: { cycleId } });
      }
    }

    // Only the newest cycle stays open; earlier periods are history.
    const all = await prisma.projectCycle.findMany({
      where: { projectId: project.id },
      orderBy: { periodStart: "desc" },
      select: { id: true },
    });
    if (all.length > 1) {
      await prisma.projectCycle.updateMany({
        where: { id: { in: all.slice(1).map((c) => c.id) } },
        data: { status: "CLOSED" },
      });
    }
  }

  totalRecords += count;
  totalCycles += cycleIds.size;
  console.log(
    `${project.name}: ${count} record(s)` +
      (write ? ` → ${cycleIds.size} cycle(s)` : " to place")
  );
}

console.log(
  write
    ? `\nDone. ${totalRecords} record(s) placed across ${totalCycles} cycle(s).`
    : `\n${totalRecords} record(s) would be placed. Re-run with --write to apply.`
);

await prisma.$disconnect();
