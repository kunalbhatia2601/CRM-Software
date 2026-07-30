"use client";

import { useState } from "react";
import { useCopilot } from "@/context/CopilotContext";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, MoreVertical, Pin, PinOff, Archive, ArchiveRestore, Trash2, Edit2, Check, X } from "lucide-react";

export function ConversationList({ onSelect }) {
  const {
    conversations,
    activeConversation,
    selectConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    isLoading,
  } = useCopilot();

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleSelect = async (conversation) => {
    if (editingId || deleteConfirmId || menuOpenId) return;
    await selectConversation(conversation.id);
    onSelect?.();
  };

  const handleNew = async () => {
    await createConversation("New Conversation");
  };

  const handleMenuToggle = (e, conversationId) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === conversationId ? null : conversationId);
  };

  const handlePin = async (conversation) => {
    await updateConversation(conversation.id, { isPinned: !conversation.isPinned });
    setMenuOpenId(null);
  };

  const handleArchive = async (conversation) => {
    await updateConversation(conversation.id, { isArchived: !conversation.isArchived });
    setMenuOpenId(null);
  };

  const handleStartEdit = (conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title || "New Conversation");
    setMenuOpenId(null);
  };

  const handleSaveEdit = async (conversation) => {
    if (editingTitle.trim()) {
      await updateConversation(conversation.id, { title: editingTitle.trim() });
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleDeleteClick = (conversation) => {
    setDeleteConfirmId(conversation.id);
    setMenuOpenId(null);
  };

  const handleConfirmDelete = async (conversation) => {
    await deleteConversation(conversation.id);
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // Close menu when clicking outside
  const closeMenu = () => setMenuOpenId(null);

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <MessageCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          No conversations yet
        </p>
        <button
          onClick={handleNew}
          disabled={isLoading}
          className="text-xs px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
        >
          Start a chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" onClick={closeMenu}>
      <div className="p-2">
        <button
          onClick={handleNew}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mb-2 disabled:opacity-50"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          New conversation
        </button>
      </div>

      <div className="space-y-1 px-2">
        {conversations.map((conversation, i) => (
          <div
            key={i}
            onClick={() => handleSelect(conversation)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              activeConversation?.id === conversation.id
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            } ${editingId === conversation.id || deleteConfirmId === conversation.id ? "opacity-50" : "cursor-pointer"}`}
          >
            {/* Delete confirmation */}
            {deleteConfirmId === conversation.id ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs text-red-600 dark:text-red-400">Delete this chat?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConfirmDelete(conversation)}
                    className="flex-1 text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : editingId === conversation.id ? (
              /* Inline edit mode */
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(conversation);
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(conversation)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              /* Normal display */
              <>
                <div className="flex items-start justify-between gap-2">
                  {activeConversation?.id === conversation.id && editingId !== conversation.id ? (
                    <span className="text-xs font-medium truncate flex-1">
                      {conversation.title || "New Conversation"}
                    </span>
                  ) : (
                    <span className="text-xs font-medium truncate flex-1">
                      {conversation.title || "New Conversation"}
                    </span>
                  )}
                  <div className="relative">
                    <button
                      onClick={(e) => handleMenuToggle(e, conversation.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <MoreVertical className="w-3 h-3 text-slate-400" />
                    </button>
                    {menuOpenId === conversation.id && (
                      <div className="absolute right-0 top-6 z-10 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
                        <button
                          onClick={() => handleStartEdit(conversation)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Edit2 className="w-3 h-3" />
                          Rename
                        </button>
                        <button
                          onClick={() => handlePin(conversation)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {conversation.isPinned ? (
                            <>
                              <PinOff className="w-3 h-3" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="w-3 h-3" />
                              Pin
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleArchive(conversation)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {conversation.isArchived ? (
                            <>
                              <ArchiveRestore className="w-3 h-3" />
                              Unarchive
                            </>
                          ) : (
                            <>
                              <Archive className="w-3 h-3" />
                              Archive
                            </>
                          )}
                        </button>
                        <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                        <button
                          onClick={() => handleDeleteClick(conversation)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
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
                  {conversation.isPinned && (
                    <span className="text-[10px] text-amber-500">📌</span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}