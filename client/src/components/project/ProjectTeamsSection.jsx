"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users2, Pencil, Check, X, Loader2 } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { updateProject, getProjectTeams } from "@/actions/projects.action";

/**
 * Teams assigned to a project, editable in place.
 *
 * The API replaces the whole set on every save (`teamIds`), so the picker
 * edits a local selection and submits it as one list.
 *
 * @param {object}   project    full project row (uses project.projectTeams)
 * @param {string}   basePath   role base for team links, e.g. "/owner"
 * @param {boolean}  canManage  show the edit control
 * @param {Function} onUpdated  called with the updated project
 */
export default function ProjectTeamsSection({ project, basePath = "/owner", canManage = false, onUpdated }) {
  const assigned = project.projectTeams || [];

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!editing) setSelected(assigned.map((pt) => pt.team?.id ?? pt.teamId).filter(Boolean));
  }, [project, editing]);

  const openEdit = async () => {
    setSelected(assigned.map((pt) => pt.team?.id ?? pt.teamId).filter(Boolean));
    setEditing(true);
    if (catalog.length === 0) {
      setLoadingCatalog(true);
      setCatalog(await getProjectTeams());
      setLoadingCatalog(false);
    }
  };

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    setSaving(true);
    const res = await updateProject(project.id, { teamIds: selected });
    setSaving(false);

    if (res.success) {
      setToast({ type: "success", message: "Teams updated" });
      setEditing(false);
      onUpdated?.(res.data);
    } else {
      setToast({ type: "error", message: res.error || "Failed to update teams" });
    }
  };

  // Nothing to show and nothing to do — stay out of the way.
  if (!canManage && assigned.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/30 flex items-center justify-center">
            <Users2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Assigned Teams</h3>
            <p className="text-xs text-slate-400">
              {assigned.length} team{assigned.length !== 1 ? "s" : ""} working on this project
            </p>
          </div>
        </div>
        {canManage && !editing && (
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Manage
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {loadingCatalog ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading teams…
            </div>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No teams exist yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {catalog.map((t) => {
                const on = selected.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggle(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      on
                        ? "bg-[#5542F6] text-white border-[#5542F6]"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
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
          </div>
        </div>
      ) : assigned.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No teams assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assigned.map((pt) => (
            <Link
              key={pt.id}
              href={`${basePath}/teams/${pt.team?.id}`}
              className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
                <Users2 className="w-5 h-5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{pt.team?.name}</p>
                {pt.team?.description && (
                  <p className="text-xs text-slate-400 truncate">{pt.team.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
