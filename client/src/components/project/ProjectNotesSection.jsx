"use client";

import { useState } from "react";
import { FileText, Pencil, Check, X, Loader2 } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { updateProject } from "@/actions/projects.action";

/**
 * Free-text project notes, editable in place.
 *
 * @param {object}   project    full project row
 * @param {boolean}  canManage  show the edit control
 * @param {Function} onUpdated  called with the updated project
 */
export default function ProjectNotesSection({ project, canManage = false, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [value, setValue] = useState(project.notes || "");

  const openEdit = () => {
    setValue(project.notes || "");
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const res = await updateProject(project.id, { notes: value.trim() || null });
    setSaving(false);

    if (res.success) {
      setToast({ type: "success", message: "Notes updated" });
      setEditing(false);
      onUpdated?.(res.data);
    } else {
      setToast({ type: "error", message: res.error || "Failed to update notes" });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Notes</h3>
        </div>
        {canManage && !editing && (
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> {project.notes ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none"
            rows={6}
            maxLength={2000}
            placeholder="Internal notes about this project…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4435cc] disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
            <span className="ml-auto text-xs text-slate-400">{value.length}/2000</span>
          </div>
        </div>
      ) : project.notes ? (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{project.notes}</p>
      ) : (
        <p className="text-sm text-slate-400 italic">No notes added yet.</p>
      )}
    </div>
  );
}
