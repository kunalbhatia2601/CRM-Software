"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Upload, Loader2, Download, Trash2, Plus, X } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useUpload } from "@/hooks/useUpload";
import { getDocumentsByUser, createDocument, deleteDocument } from "@/actions/documents.action";

const DOC_TYPES = ["AGREEMENT", "NDA", "CONTRACT", "REPORT", "OTHER"];

export default function EmployeeDocuments({ userId, canManage = true }) {
  const { upload, uploading, progress } = useUpload();
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState(null); // { name, type, fileUrl, fileKey, mimeType, fileSize }
  const [saving, setSaving] = useState(false);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = async () => {
    const res = await getDocumentsByUser(userId);
    if (res.success) setDocs(res.data || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [userId]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = await upload(file);
    e.target.value = "";
    if (r?.fileUrl) {
      setForm({ name: file.name, type: "OTHER", fileUrl: r.fileUrl, fileKey: r.key, mimeType: file.type, fileSize: file.size });
    } else {
      showToast("error", "Upload failed");
    }
  };

  const saveDoc = async () => {
    if (!form?.name?.trim()) { showToast("error", "Name required"); return; }
    setSaving(true);
    const res = await createDocument({ ...form, userId });
    setSaving(false);
    if (res.success) {
      showToast("success", "Document added");
      setForm(null);
      refresh();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteDocument(id);
    if (res.success) { setDocs((p) => p.filter((d) => d.id !== id)); showToast("success", "Deleted"); }
    else showToast("error", res.error || "Failed (owner/admin only)");
  };

  const fmtSize = (b) => (!b ? "" : b > 1e6 ? `${(b / 1e6).toFixed(1)}MB` : `${Math.round(b / 1e3)}KB`);

  return (
    <div>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Documents</h3>
        {canManage && (
          <>
            <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-lg hover:bg-[#4636d4] disabled:opacity-60">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? `Uploading ${progress}%` : "Upload"}
            </button>
          </>
        )}
      </div>

      {/* Pending upload → name + type before save */}
      {form && (
        <div className="mb-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">New document</span>
            <button onClick={() => setForm(null)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Document name"
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#5542F6]" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={saveDoc} disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-lg disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No documents uploaded.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{d.name}</p>
                <p className="text-xs text-slate-400">{d.type} · {fmtSize(d.fileSize)} · {new Date(d.createdAt).toLocaleDateString()}</p>
              </div>
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700" title="Download">
                <Download className="w-4 h-4 text-slate-400" />
              </a>
              {canManage && (
                <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
