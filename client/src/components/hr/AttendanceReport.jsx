"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { getUserAttendance } from "@/actions/attendance.action";

const STATUS_META = {
  PRESENT: { label: "Present", color: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-100 text-emerald-700" },
  ABSENT: { label: "Absent", color: "bg-red-500", text: "text-red-700", chip: "bg-red-100 text-red-700" },
  HALF_DAY_FIRST: { label: "Half (1st)", color: "bg-amber-400", text: "text-amber-700", chip: "bg-amber-100 text-amber-700" },
  HALF_DAY_SECOND: { label: "Half (2nd)", color: "bg-amber-400", text: "text-amber-700", chip: "bg-amber-100 text-amber-700" },
  ON_LEAVE: { label: "On Leave", color: "bg-blue-500", text: "text-blue-700", chip: "bg-blue-100 text-blue-700" },
  HOLIDAY: { label: "Holiday", color: "bg-purple-400", text: "text-purple-700", chip: "bg-purple-100 text-purple-700" },
  WEEKEND: { label: "Weekend", color: "bg-slate-300", text: "text-slate-500", chip: "bg-slate-100 text-slate-500" },
  WORK_FROM_HOME: { label: "WFH", color: "bg-teal-500", text: "text-teal-700", chip: "bg-teal-100 text-teal-700" },
  ON_DUTY: { label: "On Duty", color: "bg-cyan-500", text: "text-cyan-700", chip: "bg-cyan-100 text-cyan-700" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AttendanceReport({ userId, userName = "employee" }) {
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1); // 1-12
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const res = await getUserAttendance(userId, { year, month });
      if (res.success) setRecords(res.data || []);
      setLoading(false);
    })();
  }, [userId, year, month]);

  const byDate = useMemo(() => {
    const m = new Map();
    for (const r of records) m.set(new Date(r.date).getUTCDate(), r);
    return m;
  }, [records]);

  const summary = useMemo(() => {
    const s = {};
    for (const r of records) s[r.status] = (s[r.status] || 0) + 1;
    const workedMin = records.reduce((a, r) => a + (r.workedMinutes || 0), 0);
    return { s, workedHours: Math.round(workedMin / 60) };
  }, [records]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const exportCsv = () => {
    const rows = [["Date", "Status", "Check In", "Check Out", "Worked (min)", "Notes"]];
    for (let d = 1; d <= daysInMonth; d++) {
      const r = byDate.get(d);
      const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      rows.push([
        date,
        r?.status || "",
        r?.checkInAt ? new Date(r.checkInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
        r?.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
        r?.workedMinutes ?? "",
        (r?.notes || "").replace(/,/g, ";"),
      ]);
    }
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${userName.replace(/\s+/g, "_")}_${year}-${String(month).padStart(2, "0")}_attendance.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 w-28 text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(summary.s).map(([status, count]) => (
          <span key={status} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_META[status]?.chip || "bg-slate-100 text-slate-600"}`}>
            {STATUS_META[status]?.label || status}: {count}
          </span>
        ))}
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 text-white dark:bg-slate-700">
          Worked: {summary.workedHours}h
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[11px] font-semibold text-slate-400 pb-1">{d}</div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const r = byDate.get(day);
              const meta = r ? STATUS_META[r.status] : null;
              return (
                <div
                  key={day}
                  title={r ? `${day}: ${meta?.label || r.status}` : `${day}: —`}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border ${
                    r ? "border-transparent" : "border-slate-100 dark:border-slate-800"
                  } ${meta ? meta.chip : "bg-white dark:bg-slate-950"}`}
                >
                  <span className="text-xs font-medium">{day}</span>
                  {meta && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${meta.color}`} />}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
