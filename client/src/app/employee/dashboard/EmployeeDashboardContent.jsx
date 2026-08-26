"use client";

import Link from "next/link";
import {
  ListChecks, Clock, AlertTriangle, CheckCircle2, ArrowRight, CalendarDays,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ExpenseTiles from "@/components/expenses/ExpenseTiles";

const STATUS_BAR = [
  { key: "new", label: "New", color: "bg-slate-300 dark:bg-slate-600" },
  { key: "acknowledged", label: "Acknowledged", color: "bg-sky-500" },
  { key: "inProgress", label: "In Progress", color: "bg-blue-500" },
  { key: "inReview", label: "In Review", color: "bg-amber-500" },
  { key: "clientReview", label: "Client Review", color: "bg-purple-500" },
  { key: "completed", label: "Completed", color: "bg-emerald-500" },
];

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Short weekday label for an ISO yyyy-mm-dd key. */
function dayLabel(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
}

function StatCard({ icon: Icon, label, value, tone = "slate", href }) {
  const tones = {
    slate: "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    red: "text-red-600 bg-red-50 dark:bg-red-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  };
  const body = (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow h-full">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** One row in a task list. */
function TaskLine({ task, overdue = false }) {
  return (
    <Link
      href={`/employee/tasks?task=${task.id}`}
      className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg px-2 -mx-2 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge value={task.status} />
          {task.project && <span className="text-xs text-slate-400 truncate">{task.project.name}</span>}
        </div>
      </div>
      {task.dueDate && (
        <span className={`text-xs shrink-0 ${overdue ? "text-red-600 font-semibold" : "text-slate-400"}`}>
          {formatDate(task.dueDate)}
        </span>
      )}
    </Link>
  );
}

export default function EmployeeDashboardContent({ stats }) {
  const t = stats?.tasks || {};
  const week = stats?.last7Days || [];
  const totals = stats?.weekTotals || { completed: 0, assigned: 0 };

  // Scale the chart to its own busiest day so short bars stay readable.
  const peak = Math.max(1, ...week.map((d) => Math.max(d.completed, d.assigned)));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Work</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Everything assigned to you, and how the last 7 days went.
        </p>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ListChecks} label="Open tasks" value={t.open ?? 0} tone="blue" href="/employee/tasks" />
        <StatCard icon={Clock} label="Due in 7 days" value={t.dueSoon ?? 0} tone="amber" href="/employee/tasks" />
        <StatCard icon={AlertTriangle} label="Overdue" value={t.overdue ?? 0} tone="red" href="/employee/tasks" />
        <StatCard icon={CheckCircle2} label="Completed" value={t.completed ?? 0} tone="emerald" href="/employee/tasks" />
      </div>

      {/* Status breakdown */}
      {t.total > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
            Status breakdown · {t.total} task{t.total !== 1 ? "s" : ""}
          </h2>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            {STATUS_BAR.map(({ key, label, color }) =>
              t[key] > 0 ? (
                <div
                  key={key}
                  className={color}
                  style={{ width: `${(t[key] / t.total) * 100}%` }}
                  title={`${label}: ${t[key]}`}
                />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
            {STATUS_BAR.filter(({ key }) => t[key] > 0).map(({ key, label, color }) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} /> {label} ({t[key]})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last 7 days */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#5542F6]" /> Last 7 days
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> {totals.completed} completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> {totals.assigned} assigned
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 h-32">
          {week.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end justify-center gap-1 h-24">
                <div
                  className="w-1/3 max-w-3.5 rounded-t bg-emerald-500 min-h-0.5 transition-all"
                  style={{ height: `${(day.completed / peak) * 100}%` }}
                  title={`${day.completed} completed`}
                />
                <div
                  className="w-1/3 max-w-3.5 rounded-t bg-blue-500 min-h-0.5 transition-all"
                  style={{ height: `${(day.assigned / peak) * 100}%` }}
                  title={`${day.assigned} assigned`}
                />
              </div>
              <span className="text-[11px] text-slate-400">{dayLabel(day.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs attention: overdue first, then due soon */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Needs attention
          </h2>
          {(stats?.overdueTasks?.length || stats?.dueSoonTasks?.length) ? (
            <div className="flex flex-col">
              {(stats.overdueTasks || []).map((task) => (
                <TaskLine key={task.id} task={task} overdue />
              ))}
              {(stats.dueSoonTasks || []).map((task) => (
                <TaskLine key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Nothing overdue or due this week.</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#5542F6]" /> Recently updated
            </h2>
            <Link href="/employee/tasks" className="text-xs text-[#5542F6] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stats?.recentTasks?.length > 0 ? (
            <div className="flex flex-col">
              {stats.recentTasks.map((task) => (
                <TaskLine key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No tasks assigned to you yet.</p>
          )}
        </div>
      </div>
      <ExpenseTiles basePath="/employee" />

    </div>
  );
}
