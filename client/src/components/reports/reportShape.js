/**
 * Shared shape helpers for the monthly report.
 *
 * Auto values live in `snapshot`; anything typed by hand lives in `overrides`,
 * keyed by a dot path. Reading always goes through `resolve` so a hand-entered
 * value wins without ever destroying what was pulled from the CRM.
 */

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Read a dot path out of an object. */
export function at(obj, path) {
  return path.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

/**
 * The value the report should show: the override if one exists, else the auto value.
 *
 * @param {object} report
 * @param {string} path
 */
export function resolve(report, path) {
  const ov = report.overrides || {};
  if (Object.prototype.hasOwnProperty.call(ov, path)) return ov[path];
  return at(report.snapshot, path);
}

/** True when this path carries a manual value. */
export function isOverridden(report, path) {
  return Object.prototype.hasOwnProperty.call(report.overrides || {}, path);
}

/** Blank rows for the hand-entered sections. */
export const BLANK = {
  growthMetrics: { metric: "", start: null, end: null, growth: null, notes: "" },
  auditScore: { area: "", score: null, wentWell: "", needsImprovement: "", owner: "" },
  issues: { date: "", issue: "", impact: "", actionTaken: "", owner: "", status: "OPEN", notes: "" },
  nextMonthPlan: { focusArea: "", action: "", reason: "", owner: "", dueDate: "", expectedOutcome: "" },
};

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtNum = (n) =>
  n === null || n === undefined || n === "" ? "—" : new Intl.NumberFormat("en-IN").format(Number(n) || 0);

export const fmtPct = (n) => (n === null || n === undefined ? "—" : `${Number(n).toFixed(1)}%`);
