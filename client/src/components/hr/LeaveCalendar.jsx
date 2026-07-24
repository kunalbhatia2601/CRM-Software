"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { listLeaveRequests } from "@/actions/leave.action";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const STATUS_STYLE = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
};

// midnight-UTC ms for a date-only value
const dayMs = (d) => {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
};

export default function LeaveCalendar({ basePath = "/hr" }) {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth()); // 0-11
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      // Fetch approved + pending for the year, filter to month client-side.
      const res = await listLeaveRequests({ year });
      if (res.success) setRequests((res.data || []).filter((r) => ["APPROVED", "PENDING"].includes(r.status)));
      setLoading(false);
    })();
  }, [year]);

  // Map each day-of-month → leave entries overlapping it.
  const byDay = useMemo(() => {
    const map = new Map();
    const monthStart = Date.UTC(year, month, 1);
    const monthEnd = Date.UTC(year, month + 1, 0);
    for (const r of requests) {
      const from = dayMs(r.fromDate);
      const to = dayMs(r.toDate);
      for (let t = Math.max(from, monthStart); t <= Math.min(to, monthEnd); t += 86400000) {
        const day = new Date(t).getUTCDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day).push(r);
      }
    }
    return map;
  }, [requests, year, month]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();

  const name = (u) => `${u?.firstName || ""} ${u?.lastName?.[0] || ""}`.trim();

  return (
    <div className="p-6">
      <PageHeader title="Leave Calendar" description="Who is on leave, at a glance." />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 w-40 text-center">{MONTHS[month]} {year}</span>
          <button onClick={next} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-400" /> Approved</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" /> Pending</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-slate-400 pb-1">{d}</div>
          ))}
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const entries = byDay.get(day) || [];
            return (
              <div key={day} className="min-h-24 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5">
                <span className="text-xs font-medium text-slate-500">{day}</span>
                <div className="mt-1 space-y-1">
                  {entries.slice(0, 3).map((r) => (
                    <div key={r.id} className={`px-1.5 py-0.5 rounded border text-[10px] font-medium truncate ${STATUS_STYLE[r.status] || ""}`} title={`${name(r.user)} · ${r.leaveType?.name || ""} · ${r.status}`}>
                      {name(r.user)}
                    </div>
                  ))}
                  {entries.length > 3 && <div className="text-[10px] text-slate-400 px-1">+{entries.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && byDay.size === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No leaves this month.</p>
        </div>
      )}
    </div>
  );
}
