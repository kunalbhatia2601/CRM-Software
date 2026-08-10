"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Paperclip, Plus, Loader2, Check, Send } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";

const EMPTY = { note: "", content: "", files: [], links: [] };

/**
 * Hand-in form shown when a task moves to IN_REVIEW.
 *
 * Work comes in every shape — a written draft, an exported file, a Drive or
 * Figma link — so all four slots are optional individually and at least one is
 * required overall, which is the same rule the server enforces.
 *
 * @param {boolean}  isOpen
 * @param {string}   taskTitle
 * @param {boolean}  saving
 * @param {Function} onClose
 * @param {Function} onSubmit  called with the submission payload
 */
export default function SubmitWorkModal({ isOpen, taskTitle, saving = false, onClose, onSubmit }) {
  const { upload, uploading, progress } = useUpload();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);

  // The instance is reused between tasks and rounds, so each open starts empty
  // rather than inheriting the previous hand-in.
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setError(null);
    }
  }, [isOpen, taskTitle]);

  if (!isOpen) return null;

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

  const hasWork =
    form.note.trim() ||
    form.content.trim() ||
    form.files.length > 0 ||
    form.links.some((l) => l.label.trim() && l.url.trim());

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
      setError(null);
    } else {
      setError("Upload failed. Try again.");
    }
  };

  const submit = () => {
    if (!hasWork) {
      setError("Add a note, written content, a file, or a link before submitting.");
      return;
    }
    onSubmit({
      note: form.note.trim() || null,
      content: form.content.trim() || null,
      files: form.files,
      links: form.links.filter((l) => l.label.trim() && l.url.trim()),
    });
  };

  const close = () => {
    setForm(EMPTY);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Submit for review</h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{taskTitle}</p>
          </div>
          <button onClick={close} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Notes for the reviewer</label>
            <textarea
              dir="ltr"
              className={inputClass}
              rows={2}
              placeholder="What you did, what to look at, anything still open…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Written work</label>
            <textarea
              dir="ltr"
              className={inputClass}
              rows={4}
              placeholder="Copy, script, summary — anything that lives as text"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Files</label>
              <>
                <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg disabled:opacity-60"
                >
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
                    <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-indigo-600 hover:underline">
                      {f.name}
                    </a>
                    <button onClick={() => setForm({ ...form, files: form.files.filter((_, j) => j !== i) })}>
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-500">Links</label>
              <button
                onClick={() => setForm({ ...form, links: [...form.links, { label: "", url: "" }] })}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
              >
                <Plus className="w-3 h-3" /> Add link
              </button>
            </div>
            {form.links.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No links added.</p>
            ) : (
              form.links.map((l, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                  <input
                    dir="ltr"
                    className={`${inputClass} w-1/3`}
                    placeholder="Label"
                    value={l.label}
                    onChange={(e) =>
                      setForm({ ...form, links: form.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                    }
                  />
                  <input
                    className={inputClass}
                    placeholder="https://…"
                    value={l.url}
                    onChange={(e) =>
                      setForm({ ...form, links: form.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })
                    }
                  />
                  <button onClick={() => setForm({ ...form, links: form.links.filter((_, j) => j !== i) })}>
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={close}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
          </button>
        </div>
      </div>
    </div>
  );
}
