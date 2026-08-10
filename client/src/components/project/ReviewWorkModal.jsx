"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X, Loader2, Check, MessageSquarePlus, Trash2, Paperclip, ExternalLink, FileText,
} from "lucide-react";

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Comments already saved against one item in a previous review. Read-only —
 * history is never edited, only added to.
 */
function PastNotes({ notes }) {
  if (notes.length === 0) return null;
  return (
    <div className="mt-1 space-y-1">
      {notes.map((f) => (
        <div
          key={f.id}
          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
        >
          <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{f.feedback}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {f.givenBy ? `${f.givenBy.firstName} ${f.givenBy.lastName} · ` : ""}
            {fmt(f.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * Comment affordance for a single submission item, plus the notes staged
 * against it in this review.
 *
 * Declared at module scope on purpose: defining it inside the parent would make
 * it a fresh component type on every render, remounting the textarea after each
 * keystroke and throwing the caret back to the start.
 */
function ItemNotes({
  submissionId, kind, index, label,
  pastNotes, stagedNotes, draft, onOpenDraft, onDraftChange, onSaveDraft, onCancelDraft, onRemove,
}) {
  const isDrafting =
    draft &&
    draft.submissionId === submissionId &&
    draft.targetRef.kind === kind &&
    draft.targetRef.index === index;

  return (
    <div className="mt-1">
      <PastNotes notes={pastNotes} />

      {stagedNotes.map((n, i) => (
        <div
          key={i}
          className="flex items-start gap-2 mt-1 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40"
        >
          <p className="flex-1 text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{n.feedback}</p>
          <button onClick={() => onRemove(n)} title="Remove comment">
            <Trash2 className="w-3 h-3 text-amber-600" />
          </button>
        </div>
      ))}

      {isDrafting ? (
        <div className="mt-1.5 flex items-start gap-2">
          <textarea
            autoFocus
            dir="ltr"
            rows={2}
            className={INPUT_CLASS}
            placeholder={`What's wrong with ${label}?`}
            value={draft.text}
            onChange={(e) => onDraftChange(e.target.value)}
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={onSaveDraft}
              className="p-1.5 rounded-lg bg-[#5542F6] text-white hover:bg-[#4636d4]"
              title="Save comment"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCancelDraft}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => onOpenDraft(submissionId, kind, index, label)}
          className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-indigo-600 hover:underline"
        >
          <MessageSquarePlus className="w-3 h-3" /> Comment
        </button>
      )}
    </div>
  );
}

/**
 * Review a task's submitted work.
 *
 * Rounds are tabbed — a task that bounced back has several, and stacking them
 * vertically buries the one being reviewed. Comments from earlier rounds stay
 * visible on their own items so nothing is lost between rounds.
 *
 * @param {boolean}  isOpen
 * @param {object}   task       needs `title`, `submissions`, `feedbacks`
 * @param {boolean}  canApprove reviewer may sign off, not just comment
 * @param {boolean}  saving
 * @param {Function} onClose
 * @param {Function} onSubmit   ({ status, feedback, reviewNotes })
 */
export default function ReviewWorkModal({
  isOpen, task, canApprove = false, saving = false, onClose, onSubmit,
}) {
  const submissions = useMemo(
    () => [...(task?.submissions || [])].sort((a, b) => a.round - b.round),
    [task]
  );
  const feedbacks = task?.feedbacks || [];

  const [activeRound, setActiveRound] = useState(null);
  const [status, setStatus] = useState("IN_REVIEW");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState([]);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);

  // The modal instance is reused across tasks and reopenings, so every open
  // starts clean and lands on the newest round.
  // Keyed on the task, not on the submissions array — that array is rebuilt on
  // every parent render, and depending on it would wipe staged comments while
  // the reviewer is still writing them.
  useEffect(() => {
    if (!isOpen) return;
    const rounds = task?.submissions || [];
    const latest = rounds.reduce((max, s) => Math.max(max, s.round), 0);
    setActiveRound(latest || null);
    setStatus(canApprove ? "COMPLETED" : "IN_REVIEW");
    setSummary("");
    setNotes([]);
    setDraft(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, task?.id, canApprove]);

  if (!isOpen || !task) return null;

  const current = submissions.find((s) => s.round === activeRound) || submissions[submissions.length - 1];

  const pastNotesFor = (submissionId, kind, index) =>
    feedbacks.filter(
      (f) => f.submissionId === submissionId && f.targetRef?.kind === kind && f.targetRef?.index === index
    );

  const stagedNotesFor = (submissionId, kind, index) =>
    notes.filter(
      (n) => n.submissionId === submissionId && n.targetRef?.kind === kind && n.targetRef?.index === index
    );

  const openDraft = (submissionId, kind, index, label) =>
    setDraft({ submissionId, targetRef: { kind, index, label }, text: "" });

  const saveDraft = () => {
    if (!draft?.text.trim()) return;
    setNotes((prev) => [
      ...prev,
      { feedback: draft.text.trim(), submissionId: draft.submissionId, targetRef: draft.targetRef },
    ]);
    setDraft(null);
  };

  const itemProps = (kind, index, label) => ({
    submissionId: current.id,
    kind,
    index,
    label,
    pastNotes: pastNotesFor(current.id, kind, index),
    stagedNotes: stagedNotesFor(current.id, kind, index),
    draft,
    onOpenDraft: openDraft,
    onDraftChange: (text) => setDraft((d) => ({ ...d, text })),
    onSaveDraft: saveDraft,
    onCancelDraft: () => setDraft(null),
    onRemove: (n) => setNotes((prev) => prev.filter((x) => x !== n)),
  });

  const submit = () => {
    if (status === "IN_PROGRESS" && !summary.trim() && notes.length === 0) {
      setError("Say what needs changing — a summary or at least one pinned comment.");
      return;
    }
    setError(null);
    onSubmit({ status, feedback: summary.trim() || null, reviewNotes: notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Review work</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{task.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {submissions.length === 0 ? (
            <p className="text-sm text-slate-400 italic">Nothing was submitted for this task.</p>
          ) : (
            <>
              {/* Round tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                {submissions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => { setActiveRound(sub.round); setDraft(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      sub.round === current.round
                        ? "bg-[#5542F6] text-white"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-[#5542F6]"
                    }`}
                  >
                    Round {sub.round}
                  </button>
                ))}
              </div>

              {/* Active round */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                  {current.submittedBy && (
                    <span className="text-xs text-slate-500">
                      {current.submittedBy.firstName} {current.submittedBy.lastName}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 ml-auto">{fmt(current.createdAt)}</span>
                </div>

                <div className="p-4 space-y-4">
                  {current.note && (
                    <p className="text-xs text-slate-500 italic whitespace-pre-wrap">“{current.note}”</p>
                  )}

                  {current.content && (
                    <div>
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {current.content}
                        </p>
                      </div>
                      <ItemNotes {...itemProps("CONTENT", 0, "the written work")} />
                    </div>
                  )}

                  {Array.isArray(current.files) && current.files.map((f, i) => (
                    <div key={`f-${i}`}>
                      <a href={f.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        <Paperclip className="w-3.5 h-3.5 shrink-0" /> {f.name}
                      </a>
                      <ItemNotes {...itemProps("FILE", i, f.name)} />
                    </div>
                  ))}

                  {Array.isArray(current.links) && current.links.map((l, i) => (
                    <div key={`l-${i}`}>
                      <a href={l.url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {l.label}
                      </a>
                      <ItemNotes {...itemProps("LINK", i, l.label)} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Outcome */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Overall note</label>
              <textarea
                dir="ltr"
                className={INPUT_CLASS}
                rows={3}
                placeholder="Summary for the assignee (optional if you pinned comments)"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Outcome</label>
              <select className={INPUT_CLASS} value={status} onChange={(e) => setStatus(e.target.value)}>
                {canApprove && <option value="COMPLETED">Approve — mark Completed</option>}
                {canApprove && <option value="CLIENT_REVIEW">Send to Client Review</option>}
                {canApprove && <option value="IN_PROGRESS">Send back — rework needed</option>}
                <option value="IN_REVIEW">Keep In Review</option>
              </select>
            </div>

            {notes.length > 0 && (
              <p className="text-xs text-slate-500">
                {notes.length} new comment{notes.length !== 1 ? "s" : ""} will be sent with this review.
              </p>
            )}
            {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">{error}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Submit review
          </button>
        </div>
      </div>
    </div>
  );
}
