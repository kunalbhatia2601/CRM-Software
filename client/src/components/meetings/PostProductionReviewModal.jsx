"use client";

import { useState, useEffect, useMemo } from "react";
import { X, CheckCircle2, Loader2, MessageSquare, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { completePostProductionMeeting } from "@/actions/meetings.action";

const TASK_STATUS_OPTIONS = [
  { value: "", label: "Keep current status" },
  { value: "NEW", label: "New" },
  { value: "ACKNOWLEDGED", label: "Acknowledged" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CLIENT_REVIEW", label: "Client Review" },
];

/**
 * Guided review modal for completing a POST_PRODUCTION meeting.
 * Collects per-task feedback + overall meeting outcome, then submits to the
 * `completePostProductionMeeting` server action which auto-creates TaskFeedback
 * rows and (optionally) updates each linked task's status.
 */
export default function PostProductionReviewModal({ isOpen, meeting, onClose, onComplete, showToast }) {
  const linkedTasks = useMemo(() => {
    return (meeting?.meetingTasks || [])
      .map((mt) => mt.task)
      .filter(Boolean);
  }, [meeting]);

  const [outcome, setOutcome] = useState("");
  const [taskEntries, setTaskEntries] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOutcome(meeting?.outcome || "");
    setTaskEntries(
      linkedTasks.map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        currentStatus: t.status,
        feedback: "",
        nextStep: "",
        statusAfter: "", // empty means keep current
      }))
    );
  }, [isOpen, meeting, linkedTasks]);

  if (!isOpen || !meeting) return null;

  const updateEntry = (idx, field, value) => {
    setTaskEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    // Validate: each linked task should have either feedback or a status change to be meaningful.
    const hasAnyInput = taskEntries.some(
      (e) => (e.feedback || "").trim() || (e.nextStep || "").trim() || e.statusAfter
    );
    if (!hasAnyInput && !outcome.trim()) {
      showToast?.("error", "Add an overall outcome or per-task feedback before completing.");
      return;
    }

    // Build the payload — skip entries with no content
    const taskFeedbacks = taskEntries
      .filter((e) => (e.feedback || "").trim() || (e.nextStep || "").trim() || e.statusAfter)
      .map((e) => ({
        taskId: e.taskId,
        feedback: e.feedback?.trim() || null,
        nextStep: e.nextStep?.trim() || null,
        statusAfter: e.statusAfter || undefined, // let server default to current status
      }));

    setSaving(true);
    try {
      const result = await completePostProductionMeeting(meeting.id, {
        outcome: outcome.trim() || null,
        taskFeedbacks,
      });
      if (result.success) {
        showToast?.("success", "Meeting completed with feedback");
        onComplete?.(result.data);
        onClose();
      } else {
        showToast?.("error", result.error || "Failed to complete meeting");
      }
    } catch (err) {
      showToast?.("error", err?.message || "Failed to complete meeting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-950 rounded-[24px] w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Post-Production Review</h2>
              <p className="text-xs text-slate-400 mt-0.5">{meeting.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Overall outcome */}
          <div>
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
              Overall Meeting Outcome
            </label>
            <textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
              placeholder="Summarize key decisions, next steps, and overall direction..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          {/* Per-task feedback */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Per-Task Feedback ({taskEntries.length})
              </h3>
              {taskEntries.length === 0 && (
                <span className="text-xs text-slate-400">No tasks linked to this meeting</span>
              )}
            </div>

            {taskEntries.length > 0 ? (
              <div className="space-y-4">
                {taskEntries.map((entry, idx) => (
                  <div
                    key={entry.taskId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                          {entry.taskTitle}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-slate-500">Current:</span>
                          <Badge value={entry.currentStatus} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                          Feedback
                        </label>
                        <textarea
                          value={entry.feedback}
                          onChange={(e) => updateEntry(idx, "feedback", e.target.value)}
                          rows={2}
                          placeholder="What worked? What needs revision?"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                            Next Step (optional)
                          </label>
                          <input
                            type="text"
                            value={entry.nextStep}
                            onChange={(e) => updateEntry(idx, "nextStep", e.target.value)}
                            placeholder="e.g. Re-shoot hero image"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Change Status To
                          </label>
                          <select
                            value={entry.statusAfter}
                            onChange={(e) => updateEntry(idx, "statusAfter", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          >
                            {TASK_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-400">
                  No tasks were linked to this meeting. The meeting will still be marked complete
                  with the outcome above.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 font-medium">
            Submitting will mark the meeting as <strong>Completed</strong>, write per-task feedback,
            and update task statuses where specified. This action cannot be undone in one click.
          </p>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Completing..." : "Complete & Save Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}
