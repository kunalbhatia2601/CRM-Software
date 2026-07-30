import prisma from "../../utils/prisma.js";

// Status ordering — used to detect "backward" (redo/rework) transitions.
const STATUS_ORDER = { TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, COMPLETED: 3, REVIEWED: 4 };

function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}
function pct(part, whole) {
  if (!whole) return 0;
  return clamp((part / whole) * 100);
}
function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

/**
 * Get the KPI config (single row), creating defaults on first use.
 */
export async function getKpiConfig() {
  let cfg = await prisma.kpiConfig.findUnique({ where: { id: "default" } });
  if (!cfg) {
    cfg = await prisma.kpiConfig.create({
      data: {
        id: "default",
        bonusSlabs: [
          { minScore: 90, maxScore: 100, bonusAmount: 5000 },
          { minScore: 75, maxScore: 89.99, bonusAmount: 3000 },
          { minScore: 60, maxScore: 74.99, bonusAmount: 1500 },
          { minScore: 0, maxScore: 59.99, bonusAmount: 0 },
        ],
      },
    });
  }
  return cfg;
}

/**
 * Pick the bonus amount for a score from the config slabs.
 */
export function bonusForScore(score, slabs = []) {
  const s = Number(score) || 0;
  for (const slab of slabs) {
    const min = Number(slab.minScore) || 0;
    const max = Number(slab.maxScore) ?? 100;
    if (s >= min && s <= max) return Number(slab.bonusAmount) || 0;
  }
  return 0;
}

/**
 * Compute a user's KPI metrics for a given month.
 * Returns { score, metrics: {attendance, completion, onTime, reviewPass, rework}, raw }.
 *
 * @param {string} userId
 * @param {number} year
 * @param {number} month  1-12
 * @param {object} config KpiConfig row
 */
export async function computeKpi(userId, year, month, config) {
  const startDate = new Date(Date.UTC(year, month - 1, 1));           // for @db.Date (attendance)
  const endDate = new Date(Date.UTC(year, month, 0));                 // last day of month
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));      // for DateTime bounds
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));           // exclusive next-month

  // ── Attendance ──
  const attByStatus = await prisma.attendance.groupBy({
    by: ["status"],
    where: { userId, date: { gte: startDate, lte: endDate } },
    _count: { id: true },
  });
  const attMap = Object.fromEntries(attByStatus.map((r) => [r.status, r._count.id]));
  const presentStatuses = config.presentStatuses?.length ? config.presentStatuses : ["PRESENT", "WORK_FROM_HOME", "ON_DUTY"];
  const presentDays = presentStatuses.reduce((a, s) => a + (attMap[s] || 0), 0);
  const halfDays = (attMap.HALF_DAY_FIRST || 0) + (attMap.HALF_DAY_SECOND || 0);
  const leaveDays = attMap.ON_LEAVE || 0;
  const absentDays = attMap.ABSENT || 0;
  // Working days = everything except weekend/holiday.
  const workDays = presentDays + halfDays + leaveDays + absentDays;
  const attendanceScore = pct(presentDays + halfDays * 0.5, workDays);

  // ── Tasks (assignee-based, this month by createdAt for "assigned") ──
  const [assigned, completed, onTimeCompleted, reviewed, submitted] = await Promise.all([
    prisma.task.count({ where: { assigneeId: userId, createdAt: { gte: start, lt: end } } }),
    prisma.task.count({ where: { assigneeId: userId, completedAt: { gte: start, lt: end } } }),
    prisma.task.count({
      where: {
        assigneeId: userId,
        completedAt: { gte: start, lt: end },
        // completed on or before its due date
        AND: [{ dueDate: { not: null } }],
      },
    }).then(async () => {
      // Prisma can't compare two columns directly; fetch minimal rows to check on-time.
      const rows = await prisma.task.findMany({
        where: { assigneeId: userId, completedAt: { gte: start, lt: end } },
        select: { completedAt: true, dueDate: true },
      });
      return rows.filter((r) => r.dueDate && r.completedAt && r.completedAt <= r.dueDate).length;
    }),
    prisma.task.count({ where: { assigneeId: userId, reviewedAt: { gte: start, lt: end } } }),
    // "submitted" = moved to IN_REVIEW at least once this month (from feedback audit)
    prisma.taskFeedback.count({
      where: { statusAfter: "IN_REVIEW", createdAt: { gte: start, lt: end }, task: { assigneeId: userId } },
    }),
  ]);

  const completionScore = pct(completed, assigned);
  const onTimeScore = pct(onTimeCompleted, completed);
  const reviewPassScore = submitted > 0 ? pct(reviewed, submitted) : (reviewed > 0 ? 100 : 0);

  // ── Rework (redos): backward transitions in feedback for this user's tasks ──
  const feedbacks = await prisma.taskFeedback.findMany({
    where: { createdAt: { gte: start, lt: end }, task: { assigneeId: userId } },
    select: { taskId: true, statusAfter: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  // Walk per task; count moves to a lower status order than the previous.
  let redos = 0;
  const lastStatus = new Map();
  for (const f of feedbacks) {
    const prev = lastStatus.get(f.taskId);
    const now = STATUS_ORDER[f.statusAfter] ?? 0;
    if (prev !== undefined && now < prev) redos += 1;
    lastStatus.set(f.taskId, now);
  }
  // Rework score = 100 minus penalty proportional to redos vs submitted work.
  const reworkBase = Math.max(submitted, completed, 1);
  const reworkScore = clamp(100 - (redos / reworkBase) * 100);

  // ── Weighted total ──
  const w = {
    attendance: Number(config.weightAttendance) || 0,
    completion: Number(config.weightCompletion) || 0,
    onTime: Number(config.weightOnTime) || 0,
    reviewPass: Number(config.weightReviewPass) || 0,
    rework: Number(config.weightRework) || 0,
  };
  const wSum = w.attendance + w.completion + w.onTime + w.reviewPass + w.rework || 1;
  const score =
    (attendanceScore * w.attendance +
      completionScore * w.completion +
      onTimeScore * w.onTime +
      reviewPassScore * w.reviewPass +
      reworkScore * w.rework) /
    wSum;

  return {
    score: round1(score),
    metrics: {
      attendance: round1(attendanceScore),
      completion: round1(completionScore),
      onTime: round1(onTimeScore),
      reviewPass: round1(reviewPassScore),
      rework: round1(reworkScore),
    },
    raw: {
      presentDays, halfDays, leaveDays, absentDays, workDays,
      assigned, completed, onTimeCompleted, reviewed, submitted, redos,
    },
  };
}
