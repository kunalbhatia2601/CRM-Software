"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Search, Pencil, Loader2, Users, CheckCircle2, Clock, AlertCircle, UserX } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import { getDailyAttendanceSheet, manualMarkAttendance } from "@/actions/attendance.action";

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "HALF_DAY_FIRST", label: "Half Day (1st)" },
  { value: "HALF_DAY_SECOND", label: "Half Day (2nd)" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "WORK_FROM_HOME", label: "Work From Home" },
  { value: "ON_DUTY", label: "On Duty" },
  { value: "HOLIDAY", label: "Holiday" },
  { value: "WEEKEND", label: "Weekend" },
];

function formatTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(m) {
  if (!m) return "—";
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min}m`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminAttendanceDailySheet() {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // { userId, date, currentRecord }
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const fetchSheet = useCallback(async () => {
    setLoading(true);
    const res = await getDailyAttendanceSheet(date);
    if (res.success) setRows(res.data);
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchSheet(); }, [fetchSheet]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${r.user.firstName} ${r.user.lastName}`.toLowerCase();
    return name.includes(q) || r.user.email.toLowerCase().includes(q) || r.user.role.toLowerCase().includes(q);
  });

  // Summary counts
  const summary = rows.reduce(
    (acc, r) => {
      if (!r.attendance) acc.notMarked += 1;
      else if (["PRESENT", "WORK_FROM_HOME", "ON_DUTY"].includes(r.attendance.status)) acc.present += 1;
      else if (["HALF_DAY_FIRST", "HALF_DAY_SECOND"].includes(r.attendance.status)) acc.halfDay += 1;
      else if (r.attendance.status === "ON_LEAVE") acc.onLeave += 1;
      else if (r.attendance.status === "ABSENT") acc.absent += 1;
      return acc;
    },
    { present: 0, halfDay: 0, onLeave: 0, absent: 0, notMarked: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Daily Attendance</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every active user&apos;s attendance for the selected date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryCard label="Present" value={summary.present} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" icon={CheckCircle2} />
        <SummaryCard label="Half Day" value={summary.halfDay} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" icon={Clock} />
        <SummaryCard label="On Leave" value={summary.onLeave} color="bg-sky-50 dark:bg-sky-900/20 text-sky-600" icon={Calendar} />
        <SummaryCard label="Absent" value={summary.absent} color="bg-red-50 dark:bg-red-900/20 text-red-600" icon={UserX} />
        <SummaryCard label="Not Marked" value={summary.notMarked} color="bg-slate-50 dark:bg-slate-800 text-slate-600" icon={AlertCircle} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, role..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                No users match your search.
              </div>
            ) : (
              filtered.map((row) => (
                <div key={row.user.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-[#5542F6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {row.user.firstName?.[0]}{row.user.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {row.user.firstName} {row.user.lastName}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <Badge value={row.user.role} />
                      <span className="truncate">{row.user.email}</span>
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-slate-400">In</p>
                      <p className="font-medium">{formatTime(row.attendance?.checkInAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-slate-400">Out</p>
                      <p className="font-medium">{formatTime(row.attendance?.checkOutAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-slate-400">Worked</p>
                      <p className="font-medium">{formatDuration(row.attendance?.workedMinutes)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {row.attendance ? (
                      <Badge value={row.attendance.status} />
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Not marked
                      </span>
                    )}
                    <button
                      onClick={() => setEditing({
                        userId: row.user.id,
                        userName: `${row.user.firstName} ${row.user.lastName}`,
                        date,
                        currentRecord: row.attendance,
                      })}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <EditAttendanceModal
          editing={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            setSaving(true);
            const res = await manualMarkAttendance(payload);
            setSaving(false);
            if (res.success) {
              showToast("success", "Attendance saved");
              setEditing(null);
              fetchSheet();
            } else {
              showToast("error", res.error || "Failed to save");
            }
          }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${color}`}>
          <Icon className="w-3 h-3" />
        </div>
      </div>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

function EditAttendanceModal({ editing, saving, onClose, onSave }) {
  const rec = editing.currentRecord;
  const [status, setStatus] = useState(rec?.status || "PRESENT");
  const [checkInAt, setCheckInAt] = useState(rec?.checkInAt ? new Date(rec.checkInAt).toISOString().slice(0, 16) : "");
  const [checkOutAt, setCheckOutAt] = useState(rec?.checkOutAt ? new Date(rec.checkOutAt).toISOString().slice(0, 16) : "");
  const [notes, setNotes] = useState(rec?.notes || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-950 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Edit Attendance</h3>
          <p className="text-xs text-slate-400 mt-0.5">{editing.userName} · {editing.date}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
          >
            {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Check In</label>
            <input
              type="datetime-local"
              value={checkInAt}
              onChange={(e) => setCheckInAt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Check Out</label>
            <input
              type="datetime-local"
              value={checkOutAt}
              onChange={(e) => setCheckOutAt(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({
              userId: editing.userId,
              date: editing.date,
              status,
              checkInAt: checkInAt || null,
              checkOutAt: checkOutAt || null,
              notes: notes || null,
            })}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
