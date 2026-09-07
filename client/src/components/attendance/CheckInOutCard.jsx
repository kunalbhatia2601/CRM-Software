"use client";

import { useState, useEffect } from "react";
import { Clock, LogIn, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { checkIn, checkOut, getTodayAttendance } from "@/actions/attendance.action";
import { formatTime } from "@/lib/datetime";


function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function CheckInOutCard({ showToast }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let mounted = true;
    getTodayAttendance().then((res) => {
      if (!mounted) return;
      if (res.success) setRecord(res.data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleCheckIn = async () => {
    setSubmitting(true);
    const res = await checkIn();
    setSubmitting(false);
    if (res.success) {
      setRecord(res.data);
      showToast?.("success", "Checked in");
    } else {
      showToast?.("error", res.error || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    const res = await checkOut();
    setSubmitting(false);
    if (res.success) {
      setRecord(res.data);
      showToast?.("success", "Checked out");
    } else {
      showToast?.("error", res.error || "Failed to check out");
    }
  };

  const checkedIn = record?.checkInAt;
  const checkedOut = record?.checkOutAt;
  const liveMinutes = checkedIn && !checkedOut
    ? Math.max(0, Math.floor((now.getTime() - new Date(checkedIn).getTime()) / 60000))
    : null;

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#5542F6]/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#5542F6]" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-50">Attendance</h3>
            <p className="text-xs text-slate-400">
              {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
            </p>
          </div>
        </div>
        {record?.status && <Badge value={record.status} />}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Check In</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {checkedIn ? formatTime(checkedIn) : "—"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Check Out</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {checkedOut ? formatTime(checkedOut) : "—"}
              </p>
            </div>
          </div>

          {(record?.workedMinutes || liveMinutes) && (
            <p className="text-xs text-slate-500 mb-3">
              Worked: <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDuration(record?.workedMinutes ?? liveMinutes)}
              </span>
              {!checkedOut && liveMinutes !== null && <span className="text-[#5542F6]"> (live)</span>}
            </p>
          )}

          {!checkedIn && (
            <button
              onClick={handleCheckIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Check In
            </button>
          )}
          {checkedIn && !checkedOut && (
            <button
              onClick={handleCheckOut}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Check Out
            </button>
          )}
          {checkedIn && checkedOut && (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 py-2">
              <CheckCircle2 className="w-4 h-4" />
              Day completed
            </div>
          )}
        </>
      )}
    </div>
  );
}
