"use client";

import { useState } from "react";
import { Package, MessageSquare, Paperclip, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import Badge from "@/components/ui/Badge";

/** Collapsed section header showing what it holds. */
function SectionToggle({ icon: Icon, iconClass, label, count, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="w-full flex items-center gap-2 py-1.5 text-left"
    >
      <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
        {count}
      </span>
      {open ? (
        <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
      )}
    </button>
  );
}

/**
 * Read-only record of a task: everything submitted, and every review note
 * raised against it. Visible to assignee and reviewer alike, at any time.
 *
 * Both sections start collapsed — a task with several rounds would otherwise
 * bury the task itself under its own paperwork.
 *
 * @param {object} task needs `submissions` and `feedbacks`
 */
export default function TaskWorkHistory({ task }) {
  const [openWork, setOpenWork] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  const submissions = task?.submissions || [];
  const feedbacks = task?.feedbacks || [];

  if (submissions.length === 0 && feedbacks.length === 0) return null;

  const roundOf = (submissionId) => submissions.find((s) => s.id === submissionId)?.round;

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  /** Review notes pinned to one item inside a submission. */
  const notesFor = (submissionId, kind, index) =>
    feedbacks.filter(
      (f) =>
        f.submissionId === submissionId &&
        f.targetRef?.kind === kind &&
        (index === undefined || f.targetRef?.index === index)
    );

  const PinnedNotes = ({ submissionId, kind, index }) => {
    const pinned = notesFor(submissionId, kind, index);
    if (pinned.length === 0) return null;
    return (
      <div className="mt-1 space-y-1">
        {pinned.map((f) => (
          <div
            key={f.id}
            className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40"
          >
            <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{f.feedback}</p>
            {f.givenBy && (
              <p className="text-[10px] text-amber-700/70 dark:text-amber-300/60 mt-0.5">
                {f.givenBy.firstName} {f.givenBy.lastName} · {fmt(f.createdAt)}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Notes with no target are the overall review comments, listed separately.
  const generalFeedbacks = feedbacks.filter((f) => !f.targetRef);

  return (
    <div className="space-y-4">
      {submissions.length > 0 && (
        <div className="text-sm">
          <SectionToggle
            icon={Package}
            iconClass="text-[#5542F6]"
            label="Submitted work"
            count={submissions.length}
            open={openWork}
            onToggle={() => setOpenWork((v) => !v)}
          />
          {openWork && (
            <div className="flex flex-col gap-2 mt-1.5">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="px-3 py-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#5542F6] text-white">
                      Round {sub.round}
                    </span>
                    {sub.submittedBy && (
                      <span className="text-xs text-slate-500">
                        {sub.submittedBy.firstName} {sub.submittedBy.lastName}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{fmt(sub.createdAt)}</span>
                  </div>

                  {sub.note && (
                    <p className="text-xs text-slate-500 italic whitespace-pre-wrap mt-1.5">“{sub.note}”</p>
                  )}

                  {sub.content && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{sub.content}</p>
                      <PinnedNotes submissionId={sub.id} kind="CONTENT" index={0} />
                    </div>
                  )}

                  {Array.isArray(sub.files) &&
                    sub.files.map((f, i) => (
                      <div key={`f-${i}`} className="mt-2">
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
                        >
                          <Paperclip className="w-3 h-3 shrink-0" /> {f.name}
                        </a>
                        <PinnedNotes submissionId={sub.id} kind="FILE" index={i} />
                      </div>
                    ))}

                  {Array.isArray(sub.links) &&
                    sub.links.map((l, i) => (
                      <div key={`l-${i}`} className="mt-2">
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> {l.label}
                        </a>
                        <PinnedNotes submissionId={sub.id} kind="LINK" index={i} />
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {generalFeedbacks.length > 0 && (
        <div className="text-sm">
          <SectionToggle
            icon={MessageSquare}
            iconClass="text-indigo-500"
            label="History"
            count={generalFeedbacks.length}
            open={openHistory}
            onToggle={() => setOpenHistory((v) => !v)}
          />
          {openHistory && (
            <div className="flex flex-col gap-2 mt-1.5">
              {generalFeedbacks.map((f) => (
                <div
                  key={f.id}
                  className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge value={f.statusAfter} />
                    {f.submissionId && roundOf(f.submissionId) && (
                      <span className="text-[10px] font-semibold text-slate-500">
                        on round {roundOf(f.submissionId)}
                      </span>
                    )}
                    {f.givenBy && (
                      <span className="text-xs text-slate-500">
                        {f.givenBy.firstName} {f.givenBy.lastName}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{fmt(f.createdAt)}</span>
                  </div>
                  {f.nextStep && <p className="text-xs text-slate-500 mt-1">{f.nextStep}</p>}
                  {f.feedback && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-1">
                      {f.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
