"use client";

import { X, Plus, Trash2 } from "lucide-react";
import { useCopilot } from "@/context/CopilotContext";

export function CopilotHeader() {
  const { closeCopilot, createConversation, activeConversation, deleteConversation } = useCopilot();

  const handleNew = async () => {
    await createConversation("New Conversation");
  };

  const handleDelete = async () => {
    if (activeConversation && confirm("Delete this conversation?")) {
      await deleteConversation(activeConversation.id);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5542F6] to-[#4636d4] flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
            AI Copilot
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your intelligent CRM assistant
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {activeConversation && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500 transition-colors"
            title="Delete conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleNew}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors"
          title="New conversation"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={closeCopilot}
          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}