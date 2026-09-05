"use client";

import { useState, useTransition } from "react";
import {
  Phone,
  Mail,
  Video,
  ListTodo,
  MoreHorizontal,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react";
import { createFollowUp, updateFollowUp, deleteFollowUp } from "@/actions/followups.action";
import Badge from "@/components/ui/Badge";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";

const TYPE_ICONS = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Video,
  TASK: ListTodo,
  OTHER: MoreHorizontal,
};

const TYPE_COLORS = {
  CALL: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30",
  EMAIL: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-100 dark:border-indigo-900/30",
  MEETING: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30",
  TASK: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30",
  OTHER: "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700",
};

const STATUS_COLORS = {
  PENDING: "text-blue-600",
  COMPLETED: "text-emerald-600",
  SKIPPED: "text-slate-400",
  OVERDUE: "text-red-600",
};

/**
 * Follow-ups for one parent record. Pass either `leadId` or `dealId` — a
 * follow-up hangs off exactly one of them, and the server rejects both.
 */
export default function FollowUpsSection({ followUps: initialFollowUps = [], leadId, dealId, showToast }) {
  const [followUps, setFollowUps] = useState(initialFollowUps);
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    type: "CALL",
    dueAt: "",
    notes: "",
  });

  const resetForm = () => {
    setForm({ title: "", type: "CALL", dueAt: "", notes: "" });
  };

  const openCreate = () => {
    resetForm();
    setEditingFollowUp(null);
    setShowCreateModal(true);
  };

  const openEdit = (fu) => {
    setEditingFollowUp(fu);
    setForm({
      title: fu.title || "",
      type: fu.type || "CALL",
      dueAt: fu.dueAt ? new Date(fu.dueAt).toISOString().slice(0, 16) : "",
      notes: fu.notes || "",
    });
    setShowCreateModal(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast("error", "Title is required");
      return;
    }
    if (!form.dueAt) {
      showToast("error", "Due date is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        dueAt: form.dueAt,
        ...(dealId ? { dealId } : { leadId }),
      };
      if (form.notes) payload.notes = form.notes.trim();

      let result;
      if (editingFollowUp) {
        // The parent never moves on an edit, and the update schema rejects it.
        delete payload.leadId;
        delete payload.dealId;
        result = await updateFollowUp(editingFollowUp.id, payload);
      } else {
        result = await createFollowUp(payload);
      }

      if (result.success) {
        if (editingFollowUp) {
          setFollowUps((prev) => prev.map((f) => (f.id === result.data.id ? result.data : f)));
        } else {
          setFollowUps((prev) => [result.data, ...prev]);
        }
        setShowCreateModal(false);
        resetForm();
        setEditingFollowUp(null);
        showToast("success", editingFollowUp ? "Follow-up updated" : "Follow-up created");
      } else {
        showToast("error", result.error || "Failed to save follow-up");
      }
    });
  };

  const handleStatusUpdate = (fuId, newStatus) => {
    startTransition(async () => {
      const result = await updateFollowUp(fuId, { status: newStatus });
      if (result.success) {
        setFollowUps((prev) => prev.map((f) => (f.id === result.data.id ? result.data : f)));
        showToast("success", `Follow-up marked as ${newStatus.toLowerCase()}`);
      } else {
        showToast("error", result.error || "Failed to update");
      }
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteFollowUp(deletingId);
      if (result.success) {
        setFollowUps((prev) => prev.filter((f) => f.id !== deletingId));
        setDeletingId(null);
        showToast("success", "Follow-up deleted");
      } else {
        showToast("error", result.error || "Failed to delete");
      }
    });
  };

  // Separate pending (+ overdue) from completed/skipped
  const pending = followUps.filter((f) => f.status === "PENDING" || f.status === "OVERDUE");
  const done = followUps.filter((f) => f.status === "COMPLETED" || f.status === "SKIPPED");

  // Mark overdue on the fly
  const now = new Date();
  const withOverdue = pending.map((f) => {
    if (f.status === "PENDING" && new Date(f.dueAt) < now) {
      return { ...f, _isOverdue: true };
    }
    return f;
  });

  return (
    <>
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Follow-Ups</h3>
              <p className="text-xs text-slate-400">
                {pending.length} pending{done.length > 0 ? `, ${done.length} done` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {followUps.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No follow-ups added yet.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Add your first follow-up
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending / Overdue */}
            {withOverdue.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Pending</p>
                <div className="space-y-3">
                  {withOverdue.map((fu) => (
                    <FollowUpCard
                      key={fu.id}
                      followUp={fu}
                      expanded={expandedId === fu.id}
                      onToggle={() => setExpandedId(expandedId === fu.id ? null : fu.id)}
                      onEdit={() => openEdit(fu)}
                      onDelete={() => setDeletingId(fu.id)}
                      onStatusUpdate={handleStatusUpdate}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed / Skipped */}
            {done.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Completed</p>
                <div className="space-y-3">
                  {done.map((fu) => (
                    <FollowUpCard
                      key={fu.id}
                      followUp={fu}
                      expanded={expandedId === fu.id}
                      onToggle={() => setExpandedId(expandedId === fu.id ? null : fu.id)}
                      onEdit={() => openEdit(fu)}
                      onDelete={() => setDeletingId(fu.id)}
                      onStatusUpdate={handleStatusUpdate}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setEditingFollowUp(null); }} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {editingFollowUp ? "Edit Follow-Up" : "Add Follow-Up"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {editingFollowUp ? "Update follow-up details" : "Schedule a new follow-up for this lead"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <SettingsInput
                label="Title *"
                icon={ClipboardList}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Follow up on proposal"
              />
              <SettingsSelect
                label="Type"
                icon={Phone}
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                options={[
                  { value: "CALL", label: "Call" },
                  { value: "EMAIL", label: "Email" },
                  { value: "MEETING", label: "Meeting" },
                  { value: "TASK", label: "Task" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
              <SettingsInput
                label="Due Date & Time *"
                type="datetime-local"
                icon={Calendar}
                value={form.dueAt}
                onChange={(e) => setForm((p) => ({ ...p, dueAt: e.target.value }))}
              />
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="What should be done..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setEditingFollowUp(null); resetForm(); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title.trim() || !form.dueAt}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : editingFollowUp ? "Update" : "Add Follow-Up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete Follow-Up"
        message="Are you sure you want to delete this follow-up? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}

/* ─── Follow-Up Card ─── */
function FollowUpCard({ followUp, expanded, onToggle, onEdit, onDelete, onStatusUpdate, isPending }) {
  const TypeIcon = TYPE_ICONS[followUp.type] || Phone;
  const typeColor = TYPE_COLORS[followUp.type] || TYPE_COLORS.OTHER;
  const isOverdue = followUp._isOverdue;

  const dueDate = new Date(followUp.dueAt);
  const dateStr = dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = dueDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`rounded-xl border transition-colors ${isOverdue ? "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-200"}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${typeColor}`}>
            <TypeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{followUp.title}</p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeStr}
              </span>
              <Badge value={followUp.type} />
              <Badge value={followUp.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {isOverdue && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Overdue</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
          <div className="mt-4 space-y-3">
            {followUp.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{followUp.notes}</p>
              </div>
            )}
            {followUp.outcome && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Outcome</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{followUp.outcome}</p>
              </div>
            )}
            {followUp.completedAt && (
              <p className="text-xs text-slate-400">
                Completed on {new Date(followUp.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
            {followUp.createdBy && (
              <p className="text-xs text-slate-400">
                Created by {followUp.createdBy.firstName} {followUp.createdBy.lastName}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {(followUp.status === "PENDING" || followUp.status === "OVERDUE") && (
              <>
                <button
                  onClick={() => onStatusUpdate(followUp.id, "COMPLETED")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete
                </button>
                <button
                  onClick={() => onStatusUpdate(followUp.id, "SKIPPED")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Skip
                </button>
              </>
            )}
            {followUp.status === "COMPLETED" && (
              <button
                onClick={() => onStatusUpdate(followUp.id, "PENDING")}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Re-open
              </button>
            )}
            <button
              onClick={onEdit}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
