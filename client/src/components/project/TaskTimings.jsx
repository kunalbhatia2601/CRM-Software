"use client";

import { useState } from "react";
import { Clock, ChevronDown, ChevronUp, Wallet, Timer } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";

// Roles allowed to see internal costing. Mirrors PlanningSection's canViewCost.
const COST_ROLES = ["OWNER", "ADMIN", "SALES_MANAGER", "FINANCE_MANAGER"];

const COST_LABEL = { HOUR: "hour", DAY: "day", MONTH: "month" };

// Hours in a billable day / month, used to convert elapsed time into the unit
// the rate is quoted in. Calendar-accurate months are meaningless for costing.
const HOURS_PER_DAY = 8;
const HOURS_PER_MONTH = HOURS_PER_DAY * 22;

function fmtDateTime(d) {
  if (!d) return null;
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Milliseconds → "2d 4h 10m", trimmed to the two largest useful units. */
function fmtDuration(ms) {
  if (ms == null || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "under a minute";
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Row({ label, value, hint }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-slate-900 dark:text-slate-50 text-right">
        {value}
        {hint && <span className="block text-[10px] font-normal text-slate-400">{hint}</span>}
      </span>
    </div>
  );
}

/**
 * Timing and cost panel for a task.
 *
 * Timings are shown to the assignee and to anyone who can see costing.
 * The money — rate and computed actual cost — is restricted to costing roles,
 * so an employee never sees what their own time is billed at internally.
 *
 * @param {object} task needs createdAt, updatedAt, completedAt, feedbacks
 */
export default function TaskTimings({ task }) {
  const { user } = useAuth();
  const { format } = useSite();
  const [open, setOpen] = useState(false);

  if (!task) return null;

  const canViewCost = COST_ROLES.includes(user?.role);
  const isAssignee = task.assigneeId === user?.id;

  // Nothing to show to anyone else.
  if (!canViewCost && !isAssignee) return null;

  // Work started when the task first moved to IN_PROGRESS. Feedback rows are
  // written on every status change, so the earliest one is the true start.
  const started = (task.feedbacks || [])
    .filter((f) => f.statusAfter === "IN_PROGRESS")
    .map((f) => new Date(f.createdAt))
    .sort((a, b) => a - b)[0] || null;

  const completed = task.completedAt ? new Date(task.completedAt) : null;

  // Time actually spent working: start → completion. Falls back to "so far"
  // while the task is still open.
  const workMs = started ? (completed ? completed - started : Date.now() - started) : null;
  // Total elapsed since the task was raised, which includes the waiting.
  const leadMs = task.createdAt
    ? (completed ? completed - new Date(task.createdAt) : Date.now() - new Date(task.createdAt))
    : null;

  const rate = Number(task.internalCostAmount) || 0;
  const type = task.internalCostType && task.internalCostType !== "NONE" ? task.internalCostType : null;

  // Actual cost = rate × elapsed working time, converted into the rate's unit.
  let actualCost = null;
  let units = null;
  if (canViewCost && type && rate > 0 && workMs != null) {
    const hours = workMs / 3600000;
    const divisor = type === "HOUR" ? 1 : type === "DAY" ? HOURS_PER_DAY : HOURS_PER_MONTH;
    units = hours / divisor;
    actualCost = rate * units;
  }

  const hasCost = canViewCost && type;

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-full flex items-center gap-2 py-1.5 text-left"
      >
        <Clock className="w-4 h-4 shrink-0 text-slate-400" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
          Timings{hasCost ? " & cost" : ""}
        </span>
        {workMs != null && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
            {fmtDuration(workMs)}
          </span>
        )}
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        )}
      </button>

      {open && (
        <div className="mt-1.5 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <Row label="Created" value={fmtDateTime(task.createdAt)} />
          <Row label="Started" value={fmtDateTime(started)} hint="first moved to In Progress" />
          <Row label="Last updated" value={fmtDateTime(task.updatedAt)} />
          <Row label="Completed" value={fmtDateTime(task.completedAt)} />
          <Row
            label="Completion time"
            value={fmtDuration(workMs)}
            hint={started ? (completed ? "start → completed" : "running") : undefined}
          />
          <Row
            label="Total lead time"
            value={fmtDuration(leadMs)}
            hint={completed ? "created → completed" : "created → now"}
          />

          {!started && (
            <p className="text-[11px] text-slate-400 italic pt-1.5">
              Not started yet — completion time begins when the task moves to In Progress.
            </p>
          )}

          {hasCost && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <Wallet className="w-3.5 h-3.5" /> Internal costing
              </div>
              <Row label="Rate" value={`${format(rate, { decimals: 0 })} / ${COST_LABEL[type]}`} />
              {units != null && (
                <Row
                  label="Billable units"
                  value={`${units.toFixed(2)} ${COST_LABEL[type]}${units === 1 ? "" : "s"}`}
                  hint={type !== "HOUR" ? `${HOURS_PER_DAY}h day${type === "MONTH" ? " · 22 day month" : ""}` : undefined}
                />
              )}
              {actualCost != null ? (
                <div className="flex items-baseline justify-between gap-3 pt-1.5">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Actual cost
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {format(actualCost, { decimals: 0 })}
                    {!completed && <span className="block text-[10px] font-normal text-amber-600">still running</span>}
                  </span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  No actual cost yet — work has not started.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
