"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Calendar } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { listHolidays, createHoliday, updateHoliday, deleteHoliday } from "@/actions/holidays.action";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function AdminHolidaysManager() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await listHolidays(year);
    if (res.success) setHolidays(res.data);
    setLoading(false);
  }, [year]);

  useEffect(() => { refresh(); }, [refresh]);

  const openCreate = () => setEditing({ name: "", date: "", isOptional: false, notes: "" });
  const openEdit = (h) => setEditing({
    ...h,
    date: h.date ? new Date(h.date).toISOString().slice(0, 10) : "",
  });

  const handleSave = async () => {
    if (!editing.name?.trim() || !editing.date) {
      showToast("error", "Name and date are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      date: editing.date,
      isOptional: !!editing.isOptional,
      notes: editing.notes?.trim() || null,
    };
    const res = editing.id ? await updateHoliday(editing.id, payload) : await createHoliday(payload);
    setSaving(false);
    if (res.success) {
      showToast("success", editing.id ? "Holiday updated" : "Holiday added");
      setEditing(null);
      refresh();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const res = await deleteHoliday(deletingId);
    setDeleting(false);
    if (res.success) {
      showToast("success", "Holiday removed");
      setDeletingId(null);
      refresh();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  const now2 = new Date();
  const upcoming = holidays.filter((h) => new Date(h.date) >= now2);
  const past = holidays.filter((h) => new Date(h.date) < now2);

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Holidays</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Company-observed holidays for {year}.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm w-24"
          />
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]"
          >
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-4">
          <HolidayGroup title={`Upcoming (${upcoming.length})`} holidays={upcoming} openEdit={openEdit} setDeletingId={setDeletingId} />
          <HolidayGroup title={`Past (${past.length})`} holidays={past} openEdit={openEdit} setDeletingId={setDeletingId} muted />
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {editing.id ? "Edit Holiday" : "Add Holiday"}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name *</label>
              <input
                type="text"
                value={editing.name || ""}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Independence Day"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Date *</label>
              <input
                type="date"
                value={editing.date || ""}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!editing.isOptional}
                onChange={(e) => setEditing({ ...editing, isOptional: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-[#5542F6]"
              />
              Optional holiday
            </label>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Notes</label>
              <textarea
                value={editing.notes || ""}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isPending={deleting}
        title="Remove holiday?"
        message="This will remove the holiday from the calendar."
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}

function HolidayGroup({ title, holidays, openEdit, setDeletingId, muted }) {
  if (!holidays.length) return null;
  return (
    <div className={`bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ${muted ? "opacity-80" : ""}`}>
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {holidays.map((h) => (
          <div key={h.id} className="px-5 py-3 flex items-center gap-4">
            <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{h.name}</p>
                {h.isOptional && <Badge value="Optional" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(h.date)}</p>
              {h.notes && <p className="text-xs text-slate-500 mt-1">{h.notes}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(h)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button onClick={() => setDeletingId(h.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
