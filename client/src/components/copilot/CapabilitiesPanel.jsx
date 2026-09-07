"use client";

import { X, Eye, PenLine, Globe, Lock } from "lucide-react";
import { toolIcon } from "@/lib/copilotTools";

const SECTIONS = [
  {
    kind: "read",
    title: "Can read",
    hint: "Answers questions from live CRM data. Never writes anything.",
    icon: Eye,
  },
  {
    kind: "write",
    title: "Can propose",
    hint: "Drafts a task, email, status change and the like as a card with a confirm button — nothing is saved until that button is pressed.",
    icon: PenLine,
  },
  {
    kind: "search",
    title: "Can search",
    hint: "Looks things up on the open web, only when you turn it on for a message.",
    icon: Globe,
  },
];

/**
 * "What can this AI do" — the full tool list the server is actually willing
 * to hand the model, straight from GET /api/copilot/capabilities. Nothing
 * here is hand-maintained copy that can drift from what the backend supports;
 * add a tool server-side and it shows up here on its own.
 */
export function CapabilitiesPanel({ tools, onClose }) {
  return (
    <div className="absolute inset-0 z-20 bg-white dark:bg-slate-950 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">What can this AI do?</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {SECTIONS.map((section) => {
          const items = tools.filter((t) => t.kind === section.kind);
          if (!items.length) return null;
          const SectionIcon = section.icon;

          return (
            <div key={section.kind}>
              <div className="flex items-center gap-1.5 mb-1">
                <SectionIcon className="w-3.5 h-3.5 text-slate-400" />
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {section.title}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-2.5">{section.hint}</p>

              <div className="space-y-1.5">
                {items.map((tool) => {
                  const Icon = toolIcon(tool.name);
                  return (
                    <div
                      key={tool.name}
                      className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${
                        tool.enabled
                          ? "border-slate-200 dark:border-slate-800"
                          : "border-slate-100 dark:border-slate-800/60 opacity-60"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {tool.label || tool.name}
                          {tool.danger && (
                            <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                              Leaves the CRM
                            </span>
                          )}
                          {!tool.enabled && <Lock className="w-3 h-3 text-slate-400" />}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {tool.description}
                        </p>
                        {!tool.enabled && tool.disabledReason && (
                          <p className="text-[10px] text-slate-400 mt-1 italic">{tool.disabledReason}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CapabilitiesPanel;
