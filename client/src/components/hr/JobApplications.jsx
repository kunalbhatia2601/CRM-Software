"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, Phone, FileText, Download, X, ChevronDown } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { getJobApplications, updateJobApplication } from "@/actions/jobs.action";

const STATUSES = ["NEW", "REVIEWING", "SHORTLISTED", "INTERVIEW", "REJECTED", "HIRED"];
const STATUS_STYLE = {
  NEW: "bg-blue-100 text-blue-700",
  REVIEWING: "bg-amber-100 text-amber-700",
  SHORTLISTED: "bg-indigo-100 text-indigo-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
  HIRED: "bg-emerald-100 text-emerald-700",
};

// A file answer is stored as { url, name, size }.
const isFile = (v) => v && typeof v === "object" && v.url;

export default function JobApplications({ basePath = "/hr", jobId }) {
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const showToast = (type, message) => setToast({ type, message });

  useEffect(() => {
    (async () => {
      const res = await getJobApplications(jobId);
      if (res.success) { setJob(res.data.job); setApps(res.data.applications || []); }
      setLoading(false);
    })();
  }, [jobId]);

  const changeStatus = async (id, status) => {
    const res = await updateJobApplication(id, { status });
    if (res.success) { setApps((p) => p.map((a) => (a.id === id ? { ...a, status } : a))); showToast("success", "Status updated"); }
    else showToast("error", res.error || "Failed");
  };

  const filtered = statusFilter ? apps.filter((a) => a.status === statusFilter) : apps;

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <button onClick={() => router.push(`${basePath}/jobs`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Jobs
      </button>
      <PageHeader title={job?.title || "Applications"} description={`${apps.length} application${apps.length === 1 ? "" : "s"}`} />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!statusFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>All ({apps.length})</button>
        {STATUSES.map((s) => {
          const n = apps.filter((a) => a.status === s).length;
          if (!n) return null;
          return <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusFilter === s ? "bg-slate-900 text-white" : STATUS_STYLE[s]}`}>{s} ({n})</button>;
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">No applications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const open = openId === a.id;
            const answers = a.answers && typeof a.answers === "object" ? a.answers : {};
            return (
              <div key={a.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button onClick={() => setOpenId(open ? null : a.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{a.fullName}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{a.email}</span>
                      {a.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{a.phone}</span>}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
                    {/* Custom answers */}
                    {Object.keys(answers).length > 0 && (
                      <div className="space-y-2">
                        {Object.entries(answers).map(([k, v]) => (
                          <div key={k} className="text-sm">
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide">{k}</p>
                            {isFile(v) ? (
                              <a href={v.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-indigo-600 hover:underline">
                                <Download className="w-3.5 h-3.5" /> {v.name || "Download file"}
                              </a>
                            ) : (
                              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">{String(v)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Status control */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Set status:</span>
                      <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
