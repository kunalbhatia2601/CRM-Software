"use client";

import { useState } from "react";
import { CalendarRange, ChevronDown, Plus, Loader2, Check } from "lucide-react";

/**
 * Period switcher for a project's plan.
 *
 * Retainer work repeats monthly, so the board defaults to the current period
 * and past ones stay reachable — a finished month can be reviewed without its
 * records cluttering today's list. "All periods" restores the old flat view.
 *
 * @param {object[]} cycles newest first
 * @param {string} value selected cycle id, or "all"
 * @param {(id: string) => void} onChange
 * @param {() => void} onStartNext
 */
export default function CycleSelector({ cycles, value, onChange, onStartNext, canManage, starting }) {
  const [open, setOpen] = useState(false);

  if (!cycles?.length) return null;

  const selected = cycles.find((c) => c.id === value);
  const label = value === "all" ? "All periods" : selected?.label || "Select period";

  const workIn = (c) =>
    (c._count?.milestones || 0) + (c._count?.planningSteps || 0) + (c._count?.tasks || 0);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-[#5542F6] transition-colors"
        >
          <CalendarRange className="w-4 h-4 text-[#5542F6]" />
          {label}
          {selected?.status === "ACTIVE" && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              Current
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            {/* Click-away layer, so the menu closes without a document listener. */}
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-40 w-72 max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg py-1">
              {cycles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {c.label}
                      {c.status === "ACTIVE" && <span className="ml-1.5 text-[10px] text-emerald-600">current</span>}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {workIn(c)} item{workIn(c) === 1 ? "" : "s"}
                      {c._count?.tasks > 0 && ` · ${c.completedTasks}/${c._count.tasks} tasks done`}
                    </p>
                  </div>
                  {value === c.id && <Check className="w-4 h-4 text-[#5542F6] shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => { onChange("all"); setOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm text-slate-600 dark:text-slate-300">All periods</span>
                  {value === "all" && <Check className="w-4 h-4 text-[#5542F6]" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {canManage && (
        <button
          type="button"
          onClick={onStartNext}
          disabled={starting}
          title="Open the next period, optionally copying this plan into it"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:border-[#5542F6] disabled:opacity-50 transition-colors"
        >
          {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Start next
        </button>
      )}
    </div>
  );
}
