"use client";

import { useState } from "react";
import { useCopilot } from "@/context/CopilotContext";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

export function ConversationList() {
  const {
    conversations,
    activeConversation,
    selectConversation,
    createConversation,
    isLoading,
  } = useCopilot();

  const handleSelect = async (conversation) => {
    await selectConversation(conversation.id);
  };

  const handleNew = async () => {
    await createConversation("New Conversation");
  };

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <MessageCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          No conversations yet
        </p>
        <button
          onClick={handleNew}
          className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
          Start a chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mb-2"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          New conversation
        </button>
      </div>

      <div className="space-y-1 px-2">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => handleSelect(conversation)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeConversation?.id === conversation.id
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium truncate flex-1">
                {conversation.title || "New Conversation"}
              </span>
              {conversation.isPinned && (
                <span className="text-[10px] text-amber-500">📌</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {conversation.updatedAt
                  ? formatDistanceToNow(new Date(conversation.updatedAt), {
                      addSuffix: false,
                    })
                  : "just now"}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                • {conversation._count?.messages || 0} messages
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}