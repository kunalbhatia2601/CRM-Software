"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import CheckInOutCard from "@/components/attendance/CheckInOutCard";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";
import LeaveBalanceCards from "@/components/attendance/LeaveBalanceCards";
import { getMyAttendance } from "@/actions/attendance.action";
import { getMyLeaveBalances } from "@/actions/leave.action";
import { listHolidays } from "@/actions/holidays.action";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(m) {
  if (m === null || m === undefined) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}

export default function MyAttendanceContent({ initialRecords = [], initialBalances = [], initialHolidays = [] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState(initialRecords);
  const [balances, setBalances] = useState(initialBalances);
  const [holidays, setHolidays] = useState(initialHolidays);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const fetchMonth = useCallback(async (y, m) => {
    const [recRes, balRes, holRes] = await Promise.all([
      getMyAttendance({ year: y, month: m }),
      getMyLeaveBalances(y),
      listHolidays(y),
    ]);
    if (recRes.success) setRecords(recRes.data);
    if (balRes.success) setBalances(balRes.data);
    if (holRes.success) setHolidays(holRes.data);
  }, []);

  useEffect(() => {
    fetchMonth(year, month);
  }, [fetchMonth, year, month]);

  // Monthly summary
  const summary = records.reduce(
    (acc, r) => {
      if (r.status === "PRESENT" || r.status === "WORK_FROM_HOME" || r.status === "ON_DUTY") acc.present += 1;
      else if (r.status === "HALF_DAY_FIRST" || r.status === "HALF_DAY_SECOND") acc.halfDays += 1;
      else if (r.status === "ON_LEAVE") acc.leaves += 1;
      else if (r.status === "ABSENT") acc.absents += 1;
      acc.totalMinutes += r.workedMinutes || 0;
      return acc;
    },
    { present: 0, halfDays: 0, leaves: 0, absents: 0, totalMinutes: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your daily attendance, leave balance and monthly summary.
        </p>
      </div>

      {/* Top row: check-in card + summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <CheckInOutCard showToast={showToast} />
        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Present" value={summary.present} icon={CheckCircle2} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
          <SummaryCard label="Half-days" value={summary.halfDays} icon={Clock} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" />
          <SummaryCard label="Leaves" value={summary.leaves} icon={Calendar} color="bg-sky-50 dark:bg-sky-900/20 text-sky-600" />
          <SummaryCard label="Absents" value={summary.absents} icon={AlertCircle} color="bg-red-50 dark:bg-red-900/20 text-red-600" />
        </div>
      </div>

      {/* Leave balances */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-3">Leave Balance — {year}</h2>
        <LeaveBalanceCards balances={balances} />
      </div>

      {/* Calendar */}
      <AttendanceCalendar
        records={records}
        holidays={holidays}
        year={year}
        month={month}
        onMonthChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />

      {/* Month history list */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent Attendance</h2>
        </div>
        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No records for this period.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {records.slice(0, 31).map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{formatDate(r.date)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    In: {formatTime(r.checkInAt)} · Out: {formatTime(r.checkOutAt)} · Worked: {formatDuration(r.workedMinutes)}
                  </p>
                </div>
                <Badge value={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}
