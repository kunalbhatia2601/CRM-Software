"use client";

import { useState } from "react";
import { ChevronDown, XCircle } from "lucide-react";
import { toolIcon, toolShortLabel, formatMs } from "@/lib/copilotTools";

/**
 * What the assistant actually did to answer one message, and how long it took.
 *
 * Collapsed to one line by default — this is a "show your work" panel, not
 * something most people open every time. It reads straight off the message's
 * trace, which the server already trims to tool/timing/ok/summary; nothing
 * here re-derives anything.
 */
export function TraceDetails({ trace }) {
  const [open, setOpen] = useState(false);
  if (!trace || !trace.toolCallCount) return null;

  const { toolCallCount, totalMs, failedCalls, calls, callsTruncated } = trace;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        {toolCallCount} tool call{toolCallCount === 1 ? "" : "s"} · {formatMs(totalMs)}
        {failedCalls > 0 && (
          <span className="text-red-500">
            · {failedCalls} failed
          </span>
        )}
      </button>

      {open && (
        <div className="mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {calls.map((call, i) => {
            const Icon = toolIcon(call.tool);
            return (
              <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-900/60">
                {call.ok ? (
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {toolShortLabel(call.tool)}
                    {call.model && <span className="text-slate-400 font-normal"> · {call.model}</span>}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                  {formatMs(call.ms)}
                </span>
              </div>
            );
          })}
          {callsTruncated && (
            <p className="px-2.5 py-1.5 text-[10px] text-slate-400 bg-white dark:bg-slate-900/60">
              Only the first {calls.length} calls are shown.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TraceDetails;
