"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart, Sparkles, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { getProjects } from "@/actions/projects.action";
import { getReports, generateReport, deleteReport } from "@/actions/reports.action";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Reports only exist for months that have started. */
function periodOptions() {
  const now = new Date();
  const out = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return out;
}

const label = (p) => `${MONTHS[p.month - 1]} ${p.year}`;

export default function ReportsContent({ basePath = "/owner" }) {
  const router = useRouter();
  const periods = periodOptions();

  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [projectId, setProjectId] = useState("");
  const [period, setPeriod] = useState(`${periods[1].year}-${periods[1].month}`);

  const loadReports = useCallback(async () => {
    const res = await getReports({ limit: 50 });
    if (res.success) setReports(res.data.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadAllProjects(), loadReports()]);
    })();

    /** The list endpoint caps a page at 100, so walk the pages. */
    async function loadAllProjects() {
      const all = [];
      for (let page = 1; page <= 20; page++) {
        const res = await getProjects({ limit: 100, page });
        if (!res.success) break;

        all.push(...(res.data.projects || []));
        if (page >= (res.data.pagination?.totalPages || 1)) break;
      }
      setProjects(all);
    }
  }, [loadReports]);

  async function handleGenerate(refresh = false) {
    if (!projectId) return setToast({ type: "error", message: "Pick a project first" });
    const [year, month] = period.split("-").map(Number);

    setBusy(true);
    const res = await generateReport({ projectId, year, month, refresh });
    setBusy(false);

    if (!res.success) return setToast({ type: "error", message: res.error });
    router.push(`${basePath}/reports/${res.data.id}`);
  }

  async function handleDelete(id) {
    if (!confirm("Delete this report? The month can be regenerated later.")) return;
    const res = await deleteReport(id);
    if (!res.success) return setToast({ type: "error", message: res.error });
    setReports((prev) => prev.filter((r) => r.id !== id));
    setToast({ type: "success", message: "Report deleted" });
  }

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Reports</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monthly client audit reports — performance, ads, delivery and money in one place.
        </p>
      </div>

      {/* Generator */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#5542F6]" /> Generate a report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5542F6]/30"
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.client?.companyName ? ` — ${p.client.companyName}` : ""}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5542F6]/30"
          >
            {periods.map((p) => (
              <option key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                {label(p)}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => handleGenerate(false)}
              disabled={busy}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#5542F6] text-white text-sm font-semibold hover:bg-[#4535d9] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
              Generate
            </button>
            <button
              onClick={() => handleGenerate(true)}
              disabled={busy}
              title="Rebuild from current data, keeping manual entries"
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          An existing report opens as-is. Use refresh to pull the latest numbers — manual entries are kept.
        </p>
      </div>

      {/* Existing reports */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Generated reports</h2>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : reports.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No reports yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <button
                  onClick={() => router.push(`${basePath}/reports/${r.id}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                    {r.project?.name}
                    {r.project?.client?.companyName ? (
                      <span className="text-slate-400 font-normal"> · {r.project.client.companyName}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {label({ year: r.periodYear, month: r.periodMonth })} · generated{" "}
                    {new Date(r.generatedAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {r.generatedBy ? ` by ${r.generatedBy.firstName} ${r.generatedBy.lastName}` : ""}
                  </p>
                </button>

                <Badge value={r.status} />

                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete report"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
