"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { listLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from "@/actions/leave.action";
import WeekendDaysSettings from "./WeekendDaysSettings";

const DEFAULT_COLORS = ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

export default function AdminLeaveTypesManager() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = async () => {
    setLoading(true);
    const res = await listLeaveTypes();
    if (res.success) setTypes(res.data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => setEditing({ name: "", code: "", isPaid: true, defaultQuota: 12, color: DEFAULT_COLORS[0], isActive: true });
  const openEdit = (t) => setEditing({ ...t });

  const handleSave = async () => {
    if (!editing.name?.trim() || !editing.code?.trim()) {
      showToast("error", "Name and code are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      code: editing.code.trim().toUpperCase(),
      isPaid: !!editing.isPaid,
      defaultQuota: editing.defaultQuota === null || editing.defaultQuota === "" ? null : Number(editing.defaultQuota),
      color: editing.color || null,
      isActive: editing.isActive !== false,
    };
    const res = editing.id
      ? await updateLeaveType(editing.id, payload)
      : await createLeaveType(payload);
    setSaving(false);
    if (res.success) {
      showToast("success", editing.id ? "Leave type updated" : "Leave type created");
      setEditing(null);
      refresh();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    const res = await deleteLeaveType(deletingId);
    setDeleting(false);
    if (res.success) {
      showToast("success", "Leave type removed");
      setDeletingId(null);
      refresh();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Leave Types</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure the leave categories your team can request.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]"
        >
          <Plus className="w-4 h-4" /> Add Leave Type
        </button>
      </div>

      <WeekendDaysSettings />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || "#94a3b8" }} />
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{t.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button onClick={() => setDeletingId(t.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {t.code}
                </span>
                <Badge value={t.isPaid ? "Paid" : "Unpaid"} />
                {!t.isActive && <Badge value="Inactive" />}
              </div>
              <p className="text-sm text-slate-500 mt-3">
                Default quota:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {t.defaultQuota === null ? "Unlimited" : `${t.defaultQuota} days/year`}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {editing.id ? "Edit Leave Type" : "Add Leave Type"}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Name *</label>
                <input
                  type="text"
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Paid Leave"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Code *</label>
                <input
                  type="text"
                  value={editing.code || ""}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="PAID"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono focus:ring-2 focus:ring-[#5542F6] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Default Quota (days/year)</label>
              <input
                type="number"
                value={editing.defaultQuota === null ? "" : editing.defaultQuota ?? ""}
                onChange={(e) => setEditing({ ...editing, defaultQuota: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="12  (leave empty for unlimited)"
                min="0"
                step="0.5"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Leave empty or null for unlimited (e.g. unpaid leave).</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: c })}
                    className={`w-7 h-7 rounded-full border-2 ${editing.color === c ? "border-slate-900 dark:border-slate-50" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!editing.isPaid}
                  onChange={(e) => setEditing({ ...editing, isPaid: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#5542F6]"
                />
                Paid leave
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isActive !== false}
                  onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#5542F6]"
                />
                Active
              </label>
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
        title="Remove leave type?"
        message="If any approved or pending leave requests use this type, it will be deactivated instead of removed."
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
