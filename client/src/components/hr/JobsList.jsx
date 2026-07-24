"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase, Loader2, Users, Pencil, Trash2, ExternalLink } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { getJobs, deleteJob } from "@/actions/jobs.action";

const STATUS_STYLE = {
  DRAFT: "bg-slate-100 text-slate-600",
  OPEN: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-slate-100 text-slate-400",
};

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "";

export default function JobsList({ basePath = "/hr" }) {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = async () => {
    const res = await getJobs({ page: 1, limit: 100 });
    if (res.success) setJobs(res.data.jobs || []);
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    const res = await deleteJob(deletingId);
    if (res.success) { setJobs((p) => p.filter((j) => j.id !== deletingId)); showToast("success", "Job deleted"); }
    else showToast("error", res.error || "Failed");
    setDeletingId(null);
  };

  return (
    <div className="p-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <PageHeader
        title="Jobs & Careers"
        description="Post openings for your public careers page."
        actions={
          <button onClick={() => router.push(`${basePath}/jobs/create`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]">
            <Plus className="w-4 h-4" /> New Job
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-400 mb-4">No jobs posted yet.</p>
          <button onClick={() => router.push(`${basePath}/jobs/create`)} className="text-sm px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">Post your first job</button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{j.title}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLE[j.status]}`}>{j.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {[j.department, j.location, j.type?.replace("_", " "), j.workMode?.replace("_", " ")].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button onClick={() => router.push(`${basePath}/jobs/${j.id}/applications`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200">
                <Users className="w-3.5 h-3.5" /> {j._count?.applications || 0}
              </button>
              {j.status !== "DRAFT" && (
                <a href={`/careers/${j.slug}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="View public page">
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              )}
              <button onClick={() => router.push(`${basePath}/jobs/${j.id}/edit`)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4 text-slate-400" /></button>
              <button onClick={() => setDeletingId(j.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal isOpen={!!deletingId} onClose={() => setDeletingId(null)} onConfirm={handleDelete}
        title="Delete Job" message="Deletes the job and all its applications. Continue?" confirmLabel="Delete" variant="danger" />
    </div>
  );
}
