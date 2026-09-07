"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  ListPlus,
  Loader2,
  Mail,
  Phone,
  Receipt,
  RefreshCw,
  Send,
} from "lucide-react";

const ICONS = {
  create_task: ListPlus,
  create_follow_up: Phone,
  update_status: RefreshCw,
  log_expense: Receipt,
  send_email: Mail,
  send_invoice: Send,
};

/**
 * One thing the assistant wants to do, shown for review before it happens.
 *
 * The card is deliberately literal: every value that will be written is on
 * screen, in the reader's words, before the button is pressed. Nothing here
 * has touched the database — the button is the only thing that does.
 */
export function ActionCard({ action, onRun, onGoTo }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const done = action.status === "done";
  const Icon = ICONS[action.kind] || ListPlus;

  const run = async () => {
    if (busy || done) return;
    setBusy(true);
    setError(null);
    const res = await onRun(action.id);
    setBusy(false);
    if (!res?.success) setError(res?.error || "That didn't work.");
  };

  const entity = action.result?.entity;

  return (
    <div
      className={`mt-2 rounded-xl border overflow-hidden ${
        done
          ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20"
          : action.danger
            ? "border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 px-3.5 pt-3 pb-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            done
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}
        >
          {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {done ? `${action.label} · done` : action.label}
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">
            {action.title}
          </p>
        </div>
      </div>

      {/* Everything that will be written */}
      <dl className="px-3.5 pb-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {action.fields?.map((f, i) => (
          <div key={i} className={f.wide ? "col-span-2" : ""}>
            <dt className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {f.label}
            </dt>
            <dd className="text-xs text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>

      {action.warnings?.length > 0 && !done && (
        <div className="mx-3.5 mb-3 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2.5 py-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-px" />
          <div className="text-[11px] text-amber-700 dark:text-amber-300 space-y-0.5">
            {action.warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mx-3.5 mb-3 text-[11px] text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Footer */}
      <div
        className={`px-3.5 py-2.5 border-t flex items-center gap-2 ${
          done
            ? "border-emerald-200 dark:border-emerald-900"
            : "border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40"
        }`}
      >
        {done ? (
          <>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1 min-w-0 truncate">
              {action.result?.message || "Done"}
            </p>
            {entity && onGoTo && (
              <button
                onClick={() => onGoTo(entity)}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
              >
                Open
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex-1 min-w-0">
              Nothing is saved until you confirm.
            </p>
            <button
              onClick={run}
              disabled={busy}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-60 ${
                action.danger
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#5542F6] hover:bg-[#4636d4]"
              }`}
            >
              {busy ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working…
                </>
              ) : (
                action.button || "Confirm"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ActionCard;
