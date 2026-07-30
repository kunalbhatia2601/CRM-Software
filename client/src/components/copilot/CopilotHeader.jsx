"use client";

import { X, Plus, PanelLeft, Sparkles } from "lucide-react";
import { useCopilot } from "@/context/CopilotContext";

export function CopilotHeader({ onToggleList, listOpen }) {
  const { closeCopilot, createConversation, activeConversation } = useCopilot();

  const handleNew = async () => {
    await createConversation("New Conversation");
  };

  return (
    <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleList}
          className={`p-2 rounded-lg transition-colors ${listOpen ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"}`}
          title="Conversations"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#5542F6] to-[#4636d4] flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
            {activeConversation?.title || "AI Copilot"}
          </h2>
          <p className="text-[11px] text-slate-400">CRM assistant</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleNew}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"
          title="New chat"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={closeCopilot}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
