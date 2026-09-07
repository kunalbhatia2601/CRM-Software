"use client";

import { useState, useEffect } from "react";
import { CalendarPlus, Loader2, X, Copy } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getCarryOverCandidates } from "@/actions/projectCycles.action";

/**
 * Open the next delivery period.
 *
 * Two separate decisions, deliberately not merged: copying the *plan* forward
 * (new work, reset to unstarted) and carrying *unfinished tasks* forward (the
 * same task, moved). Copying a task that is already half-done would be wrong,
 * and leaving unfinished work stranded in a closed month would be worse.
 */
export default function StartCycleModal({ isOpen, currentCycle, saving, error, onClose, onConfirm }) {
  const [clone, setClone] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentCycle?.id) return;

    setClone(true);
    setSelected([]);
    setLoading(true);

    getCarryOverCandidates(currentCycle.id).then((res) => {
      setCandidates(res.success ? res.data : []);
      setLoading(false);
    });
  }, [isOpen, currentCycle?.id]);

  if (!isOpen) return null;

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5542F6]/10 flex items-center justify-center">
              <CalendarPlus className="w-4.5 h-4.5 text-[#5542F6]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Start next period</h3>
              <p className="text-xs text-slate-400">
                {currentCycle?.label ? `Following ${currentCycle.label}` : "Opens the next period"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* The page toast sits behind this dialog, so the reason has to be
              repeated where the user is actually looking. */}
          {error && (
            <p className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-[#5542F6] transition-colors">
            <input
              type="checkbox"
              checked={clone}
              onChange={(e) => setClone(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#5542F6]"
            />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Copy this period's plan
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Milestones, planning steps and tasks are recreated with their assignees and costing.
                Statuses, dates and completion history start clean.
              </p>
            </div>
          </label>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">
              Carry unfinished work forward
              {candidates.length > 0 && ` (${selected.length}/${candidates.length} selected)`}
            </p>

            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
            ) : candidates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Nothing unfinished — this period is fully complete.
              </p>
            ) : (
              <>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
                  {candidates.map((t) => (
                    <label key={t.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <input
                        type="checkbox"
                        checked={selected.includes(t.id)}
                        onChange={() => toggle(t.id)}
                        className="w-4 h-4 accent-[#5542F6] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-900 dark:text-slate-50 truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge value={t.status} />
                          {t.assignee && (
                            <span className="text-[11px] text-slate-400">
                              {t.assignee.firstName} {t.assignee.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Selected tasks move into the new period. Anything left behind stays in {currentCycle?.label},
                  which is closed but still viewable.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ clone, carryOverTaskIds: selected })}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5542F6] text-white text-sm font-semibold hover:bg-[#4636d4] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            {saving ? "Starting…" : "Start period"}
          </button>
        </div>
      </div>
    </div>
  );
}
