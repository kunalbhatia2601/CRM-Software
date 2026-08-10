"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package, Plus, Loader2, X, Check, Trash2, Pencil, Upload, Paperclip,
  Link as LinkIcon, MessageSquare, AlertCircle, ThumbsUp, RotateCcw, Eye, EyeOff, Send,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useUpload } from "@/hooks/useUpload";
import {
  getProjectDeliverables, createDeliverable, updateDeliverable,
  deleteDeliverable, addDeliverableFeedback,
} from "@/actions/deliverables.action";

const STATUS_STYLE = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CHANGES_REQUESTED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};
const STATUSES = ["IN_PROGRESS", "IN_REVIEW", "CHANGES_REQUESTED", "COMPLETED"];

// Deliverables track live work, so only open tasks are offered.
const TASK_LINKABLE = ["TODO", "IN_PROGRESS", "IN_REVIEW"];

/** Eligible tasks, plus anything already linked so existing links stay editable. */
function linkableTasks(list, selected) {
  return (list || []).filter((t) => TASK_LINKABLE.includes(t.status) || selected.includes(t.id));
}

function toggleId(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Chip-style multi-select for linking plan items to a deliverable. */
function MultiPicker({ label, options, selected, onToggle, emptyHint }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label} (optional)</label>
      {options.length === 0 ? (
        <p className="text-xs text-slate-400 italic">{emptyHint}</p>
      ) : (
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                on
                  ? "bg-[#5542F6] text-white border-[#5542F6]"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
              }`}
            >
              {o.title}
              {o.status && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  on ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  {o.status.replace(/_/g, " ")}
                </span>
              )}
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}

const EMPTY = {
  title: "", description: "", content: "", files: [], links: [],
  status: "IN_PROGRESS", requiresFeedback: false, isPublished: false,
  milestoneIds: [], planningStepIds: [], taskIds: [],
};

/**
 * Project deliverables — staff create/publish, clients review + give feedback.
 *
 * @param {string}  projectId
 * @param {boolean} canManage  staff view (create/edit/delete/publish)
 * @param {boolean} canReview  show approve / request-changes controls
 * @param {Array}   milestones optional, for linking
 * @param {Array}   steps      optional, for linking
 * @param {Array}   tasks      optional, for linking
 */
export default function DeliverablesSection({
  projectId, canManage = false, canReview = false,
  milestones = [], steps = [], tasks = [],
  isClient = false,
}) {
  const { upload, uploading, progress } = useUpload();
  const fileRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState(null); // null = closed; object = create/edit
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Feedback composer per deliverable
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = async () => {
    const res = await getProjectDeliverables(projectId);
    if (res.success) setItems(res.data || []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, [projectId]);

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); };
  const openEdit = (d) => {
    setEditingId(d.id);
    setForm({
      title: d.title || "", description: d.description || "", content: d.content || "",
      files: Array.isArray(d.files) ? d.files : [],
      links: Array.isArray(d.links) ? d.links : [],
      status: d.status, requiresFeedback: !!d.requiresFeedback, isPublished: !!d.isPublished,
      milestoneIds: (d.milestones || []).map((x) => x.milestoneId || x.milestone?.id).filter(Boolean),
      planningStepIds: (d.planningSteps || []).map((x) => x.planningStepId || x.planningStep?.id).filter(Boolean),
      taskIds: (d.tasks || []).map((x) => x.taskId || x.task?.id).filter(Boolean),
    });
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = await upload(file);
    if (r?.fileUrl) {
      setForm((p) => ({
        ...p,
        files: [...p.files, { name: file.name, url: r.fileUrl, key: r.key, mimeType: file.type, size: file.size }],
      }));
    } else showToast("error", "Upload failed");
  };

  const save = async () => {
    if (!form.title.trim()) { showToast("error", "Title is required"); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      content: form.content || null,
      files: form.files,
      links: form.links.filter((l) => l.label?.trim() && l.url?.trim()),
      status: form.status,
      requiresFeedback: form.requiresFeedback,
      isPublished: form.isPublished,
      milestoneIds: form.milestoneIds,
      planningStepIds: form.planningStepIds,
      taskIds: form.taskIds,
    };
    const res = editingId
      ? await updateDeliverable(editingId, payload)
      : await createDeliverable({ ...payload, projectId });
    setSaving(false);
    if (res.success) {
      showToast("success", editingId ? "Deliverable updated" : "Deliverable created");
      setForm(null); setEditingId(null); refresh();
    } else showToast("error", res.error || "Failed to save");
  };

  const togglePublish = async (d) => {
    const res = await updateDeliverable(d.id, { isPublished: !d.isPublished });
    if (res.success) {
      setItems((p) => p.map((x) => (x.id === d.id ? res.data : x)));
      showToast("success", d.isPublished ? "Hidden from client" : "Published to client");
    } else showToast("error", res.error || "Failed");
  };

  const handleDelete = async () => {
    const res = await deleteDeliverable(deletingId);
    if (res.success) { setItems((p) => p.filter((x) => x.id !== deletingId)); showToast("success", "Deleted"); }
    else showToast("error", res.error || "Failed");
    setDeletingId(null);
  };

  const sendFeedback = async (d, type) => {
    if (type === "CHANGES_REQUESTED" && !feedbackMsg.trim()) {
      showToast("error", "Please describe the changes you need");
      return;
    }
    setSendingFeedback(true);
    const res = await addDeliverableFeedback(d.id, { type, message: feedbackMsg.trim() || null });
    setSendingFeedback(false);
    if (res.success) {
      setItems((p) => p.map((x) => (x.id === d.id ? res.data : x)));
      setFeedbackFor(null); setFeedbackMsg("");
      showToast("success", type === "APPROVED" ? "Approved" : type === "CHANGES_REQUESTED" ? "Changes requested" : "Comment added");
    } else showToast("error", res.error || "Failed to submit feedback");
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

  if (!canManage && !loading && items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-[#5542F6]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Deliverables</h2>
            <p className="text-xs text-slate-400">Work shared with the client</p>
          </div>
        </div>
        {canManage && !form && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-3 py-2 bg-[#5542F6] text-white text-xs font-semibold rounded-xl hover:bg-[#4636d4]">
            <Plus className="w-3.5 h-3.5" /> Add Deliverable
          </button>
        )}
      </div>

      {/* Create / edit form */}
      {form && (
        <div className="mb-5 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{editingId ? "Edit deliverable" : "New deliverable"}</span>
            <button onClick={() => { setForm(null); setEditingId(null); }}><X className="w-4 h-4 text-slate-400" /></button>
          </div>

          <input className={inputClass} placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className={inputClass} rows={2} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className={inputClass} rows={3} placeholder="Text content (optional)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />

          {/* Files */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Files</label>
              <>
                <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg disabled:opacity-60">
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploading ? `${progress}%` : "Upload"}
                </button>
              </>
            </div>
            {form.files.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No files attached.</p>
            ) : (
              <div className="space-y-1">
                {form.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-indigo-600 hover:underline">{f.name}</a>
                    <button onClick={() => setForm({ ...form, files: form.files.filter((_, j) => j !== i) })}>
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Links</label>
              <button onClick={() => setForm({ ...form, links: [...form.links, { label: "", url: "" }] })}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg">
                <Plus className="w-3 h-3" /> Add link
              </button>
            </div>
            {form.links.map((l, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <input className={`${inputClass} w-1/3`} placeholder="Label" value={l.label}
                  onChange={(e) => setForm({ ...form, links: form.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                <input className={inputClass} placeholder="https://…" value={l.url}
                  onChange={(e) => setForm({ ...form, links: form.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                <button onClick={() => setForm({ ...form, links: form.links.filter((_, j) => j !== i) })}>
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Meta */}
          <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>

          <div className="space-y-2">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Milestones and steps can be linked at any status. Tasks only while they are new, in progress or in review.
            </p>
            <MultiPicker label="Milestones" emptyHint="No milestones on this project."
              options={milestones} selected={form.milestoneIds}
              onToggle={(id) => setForm({ ...form, milestoneIds: toggleId(form.milestoneIds, id) })} />
            <MultiPicker label="Planning steps" emptyHint="No planning steps on this project."
              options={steps} selected={form.planningStepIds}
              onToggle={(id) => setForm({ ...form, planningStepIds: toggleId(form.planningStepIds, id) })} />
            <MultiPicker label="Tasks" emptyHint="No open tasks on this project."
              options={linkableTasks(tasks, form.taskIds)} selected={form.taskIds}
              onToggle={(id) => setForm({ ...form, taskIds: toggleId(form.taskIds, id) })} />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-[#5542F6]" checked={form.requiresFeedback}
                onChange={(e) => setForm({ ...form, requiresFeedback: e.target.checked })} />
              Feedback required
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-[#5542F6]" checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
              Visible to client
            </label>
            <button onClick={save} disabled={saving}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No deliverables yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((d) => {
            const open = expandedId === d.id;
            const files = Array.isArray(d.files) ? d.files : [];
            const links = Array.isArray(d.links) ? d.links : [];
            return (
              <div key={d.id} className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900">
                  <button onClick={() => setExpandedId(open ? null : d.id)} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{d.title}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLE[d.status]}`}>
                        {d.status.replace(/_/g, " ")}
                      </span>
                      {d.requiresFeedback && d.status !== "COMPLETED" && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-100 text-purple-700">Feedback needed</span>
                      )}
                      {canManage && !d.isPublished && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-200 text-slate-500">Draft</span>
                      )}
                    </div>
                    {d.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{d.description}</p>}
                  </button>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => togglePublish(d)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                        title={d.isPublished ? "Hide from client" : "Publish to client"}>
                        {d.isPublished ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                      </button>
                      <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                        <Pencil className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => setDeletingId(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>

                {open && (
                  <div className="p-4 space-y-4 border-t border-slate-100 dark:border-slate-800">
                    {d.content && <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">{d.content}</p>}

                    {files.length > 0 && (
                      <div className="space-y-1">
                        {files.map((f, i) => (
                          <a key={i} href={f.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                            <Paperclip className="w-3.5 h-3.5" /> {f.name}
                          </a>
                        ))}
                      </div>
                    )}

                    {links.length > 0 && (
                      <div className="space-y-1">
                        {links.map((l, i) => (
                          <a key={i} href={l.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                            <LinkIcon className="w-3.5 h-3.5" /> {l.label}
                          </a>
                        ))}
                      </div>
                    )}

                    {(d.milestones?.length > 0 || d.planningSteps?.length > 0 || d.tasks?.length > 0) && !isClient && (
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {(d.milestones || []).map((m) => (
                          <span key={m.id} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Milestone: {m.milestone?.title}</span>
                        ))}
                        {(d.planningSteps || []).map((st) => (
                          <span key={st.id} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Step: {st.planningStep?.title}</span>
                        ))}
                        {(d.tasks || []).map((t) => (
                          <span key={t.id} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Task: {t.task?.title}</span>
                        ))}
                      </div>
                    )}

                    {/* Feedback thread */}
                    {d.feedbacks?.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {d.feedbacks.map((f) => (
                          <div key={f.id} className="flex items-start gap-2 text-sm">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs">
                                <span className="font-medium text-slate-700 dark:text-slate-300">{f.givenBy?.firstName} {f.givenBy?.lastName}</span>
                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  f.type === "APPROVED" ? "bg-emerald-100 text-emerald-700"
                                  : f.type === "CHANGES_REQUESTED" ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-600"}`}>
                                  {f.type.replace(/_/g, " ")}
                                </span>
                                <span className="ml-2 text-slate-400">{new Date(f.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                              </p>
                              {f.message && <p className="text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-line">{f.message}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Review actions */}
                    {canReview && d.status !== "COMPLETED" && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        {feedbackFor === d.id ? (
                          <div className="space-y-2">
                            <textarea className={inputClass} rows={2} placeholder="Your feedback…"
                              value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)} autoFocus />
                            <div className="flex items-center gap-2 flex-wrap">
                              <button onClick={() => sendFeedback(d, "APPROVED")} disabled={sendingFeedback}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 disabled:opacity-60">
                                <ThumbsUp className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button onClick={() => sendFeedback(d, "CHANGES_REQUESTED")} disabled={sendingFeedback}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60">
                                <RotateCcw className="w-3.5 h-3.5" /> Request changes
                              </button>
                              <button onClick={() => sendFeedback(d, "COMMENT")} disabled={sendingFeedback}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-xs font-semibold rounded-lg">
                                <Send className="w-3.5 h-3.5" /> Comment
                              </button>
                              <button onClick={() => { setFeedbackFor(null); setFeedbackMsg(""); }} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setFeedbackFor(d.id); setFeedbackMsg(""); }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-lg hover:bg-[#4636d4]">
                            <MessageSquare className="w-3.5 h-3.5" /> Review & give feedback
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Deliverable"
        message="This removes the deliverable and its feedback. Continue?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
