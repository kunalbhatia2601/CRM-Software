"use client";

import { useState, useEffect } from "react";
import { Megaphone, Send, Loader2, Trash2, Pin } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "@/actions/announcements.action";

const AUDIENCES = [
  { value: "ALL", label: "Everyone" },
  { value: "EMPLOYEES", label: "Employees" },
  { value: "MANAGERS", label: "Managers" },
  { value: "HR", label: "HR" },
];
const AUD_LABEL = Object.fromEntries(AUDIENCES.map((a) => [a.value, a.label]));

export default function Announcements({ canManage = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", audience: "ALL", isPinned: false });
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = async () => {
    const res = await getAnnouncements({ page: 1, limit: 50 });
    if (res.success) setItems(res.data.announcements || []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const post = async () => {
    if (!form.title.trim() || !form.body.trim()) { showToast("error", "Title and body required"); return; }
    setPosting(true);
    const res = await createAnnouncement(form);
    setPosting(false);
    if (res.success) {
      showToast("success", "Announcement posted & notified");
      setForm({ title: "", body: "", audience: "ALL", isPinned: false });
      refresh();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const res = await deleteAnnouncement(deletingId);
    if (res.success) { setItems((p) => p.filter((a) => a.id !== deletingId)); showToast("success", "Deleted"); }
    else showToast("error", res.error || "Failed");
    setDeletingId(null);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none";

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <PageHeader title="Announcements" description="Broadcast to your team. Recipients get an in-app notification." />

      {canManage && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6 space-y-3">
          <input className={inputClass} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className={inputClass} rows={3} placeholder="Write your announcement..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <div className="flex items-center gap-3 flex-wrap">
            <select className={`${inputClass} w-auto`} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="accent-[#5542F6]" />
              Pin
            </label>
            <button onClick={post} disabled={posting}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {a.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">{a.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{a.body}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{AUD_LABEL[a.audience] || a.audience}</span>
                    <span>· {a.createdBy?.firstName} {a.createdBy?.lastName}</span>
                    <span>· {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => setDeletingId(a.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete}
        title="Delete Announcement" message="Remove this announcement? Sent notifications stay." confirmLabel="Delete" variant="danger" />
    </div>
  );
}
