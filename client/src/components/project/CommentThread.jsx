"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { createComment, getComments, deleteComment } from "@/actions/comments.action";

export default function CommentThread({ entityType, entityId, showToast }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getComments(entityType, entityId);
      if (result.success) setComments(result.data);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const result = await createComment({
        content: newComment.trim(),
        entityType,
        entityId,
      });
      if (result.success) {
        setComments((prev) => [...prev, result.data]);
        setNewComment("");
        showToast?.("success", "Comment added");
      } else {
        showToast?.("error", result.error || "Failed to add comment");
      }
    } catch {
      showToast?.("error", "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    try {
      const result = await deleteComment(commentId);
      if (result.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast?.("success", "Comment deleted");
      } else {
        showToast?.("error", result.error || "Failed to delete comment");
      }
    } catch {
      showToast?.("error", "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
        <MessageCircle className="w-3.5 h-3.5" />
        Comments {comments.length > 0 && `(${comments.length})`}
      </h5>

      {/* Comment list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 mb-3">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {comment.author?.firstName} {comment.author?.lastName}
                  </span>
                  {comment.author?.role && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                      {comment.author.role}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{formatRelativeTime(comment.createdAt)}</span>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingId === comment.id}
                    className="opacity-0 group-hover:opacity-100 ml-auto p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                    title="Delete comment"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-red-400" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 mb-3">No comments yet. Start the conversation.</p>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="px-3 py-2 bg-[#5542F6] text-white rounded-xl hover:bg-[#4636d4] disabled:opacity-50 transition-colors flex items-center gap-1.5"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
