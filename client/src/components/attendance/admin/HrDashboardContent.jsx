"use client";

import Link from "next/link";
import { Users, CheckCircle2, Clock, Calendar, UserX, AlertCircle, ArrowRight, FileText } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import ExpenseTiles from "@/components/expenses/ExpenseTiles";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Props:
 *  - stats: the HR dashboard payload (or null)
 *  - basePath: "/hr" | "/owner" | "/admin" — used for navigation links so this component
 *              works from any of the three admin portals.
 */
export default function HrDashboardContent({ stats, basePath = "/hr" }) {
  const { user } = useAuth();
  const userName = user?.firstName || "there";

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-400">Unable to load HR dashboard data.</p>
        </div>
      </div>
    );
  }

  const today = stats.today || {};

  const statCards = [
    { label: "Active Employees", value: stats.totalActiveUsers, icon: Users, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" },
    { label: "Present Today", value: today.present || 0, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" },
    { label: "On Leave", value: today.onLeave || 0, icon: Calendar, color: "bg-sky-50 dark:bg-sky-900/20 text-sky-600" },
    { label: "Pending Leaves", value: stats.pendingLeaveCount || 0, icon: FileText, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600", href: `${basePath}/leave-requests` },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Hello, {userName}! <span className="text-xl">👋</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Today&apos;s attendance snapshot and HR actions.</p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Wrapper = s.href ? Link : "div";
          return (
            <Wrapper
              key={s.label}
              {...(s.href ? { href: s.href } : {})}
              className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{s.value}</p>
            </Wrapper>
          );
        })}
      </div>

      {/* Today breakdown bar */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Today&apos;s Breakdown</h2>
        <TodayBar stats={today} total={stats.totalActiveUsers} />
        <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present ({today.present || 0})</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Half Day ({today.halfDay || 0})</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-500" /> On Leave ({today.onLeave || 0})</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Absent ({today.absent || 0})</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" /> Not Marked ({today.notMarked || 0})</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending leave requests */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5542F6]" />
              Pending Leave Requests
            </h2>
            <Link href={`${basePath}/leave-requests`} className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.recentLeaveRequests?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentLeaveRequests.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="w-8 h-8 rounded-full bg-[#5542F6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {r.user?.firstName} {r.user?.lastName}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.leaveType?.color || "#94a3b8" }} />
                      {r.leaveType?.name} · {r.totalDays} day{r.totalDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Badge value="PENDING" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No pending requests. All caught up!</p>
          )}
        </div>

        {/* Upcoming holidays */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5542F6]" />
              Upcoming Holidays
            </h2>
            <Link href={`${basePath}/holidays`} className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.upcomingHolidays?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingHolidays.map((h) => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{h.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(h.date)}</p>
                  </div>
                  {h.isOptional && <Badge value="Optional" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No holidays scheduled in the next 30 days.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TodayBar({ stats, total }) {
  const t = total || 1;
  const segs = [
    { value: stats.present || 0, color: "bg-emerald-500", key: "p" },
    { value: stats.halfDay || 0, color: "bg-amber-500", key: "h" },
    { value: stats.onLeave || 0, color: "bg-sky-500", key: "l" },
    { value: stats.absent || 0, color: "bg-red-500", key: "a" },
    { value: stats.notMarked || 0, color: "bg-slate-300 dark:bg-slate-700", key: "nm" },
  ];
  return (
    <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
      {segs.map((s) => (
        <div
          key={s.key}
          className={s.color}
          style={{ width: `${(s.value / t) * 100}%` }}
          title={`${s.value}`}
        />
      ))}
      <ExpenseTiles basePath="/hr" />

    </div>
  );
}
