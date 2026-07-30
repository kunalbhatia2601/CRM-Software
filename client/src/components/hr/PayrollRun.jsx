"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Wallet, Settings2, ChevronRight as Arrow } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { getPayroll, generatePayroll } from "@/actions/payroll.action";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STATUS_STYLE = {
  DRAFT: "bg-slate-100 text-slate-600",
  FINALIZED: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
};

function scoreColor(s) {
  if (s >= 80) return "text-emerald-600";
  if (s >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function PayrollRun({ basePath = "/hr" }) {
  const router = useRouter();
  const { format } = useSite();
  const now = new Date();
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [data, setData] = useState({ records: [], totals: { base: 0, bonus: 0, net: 0 } });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getPayroll(year, month);
    if (res.success) setData(res.data);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prev = () => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); };
  const next = () => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); };

  const run = async () => {
    setGenerating(true);
    const res = await generatePayroll(year, month);
    setGenerating(false);
    if (res.success) {
      showToast("success", `Generated: ${res.data.created} new, ${res.data.updated} updated, ${res.data.skipped} locked`);
      load();
    } else showToast("error", res.error || "Failed");
  };

  return (
    <div className="p-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <PageHeader
        title="Payroll"
        description="Auto-computed pay + KPI performance bonus per employee."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`${basePath}/payroll/config`)}
              className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200">
              <Settings2 className="w-4 h-4" /> KPI Config
            </button>
            <button onClick={run} disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Generate / Refresh
            </button>
          </div>
        }
      />

      {/* Month nav + totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 w-28 text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={next} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Base <b className="text-slate-700 dark:text-slate-200">{format(data.totals.base)}</b></span>
          <span className="text-slate-400">Bonus <b className="text-emerald-600">{format(data.totals.bonus)}</b></span>
          <span className="text-slate-400">Net <b className="text-slate-900 dark:text-slate-50">{format(data.totals.net)}</b></span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : data.records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 mb-4">No payroll for {MONTHS[month - 1]} {year}.</p>
            <button onClick={run} className="text-sm px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">Generate now</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium text-center">KPI</th>
                <th className="px-5 py-3 font-medium text-right">Base</th>
                <th className="px-5 py-3 font-medium text-right">Bonus</th>
                <th className="px-5 py-3 font-medium text-right">Net</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data.records.map((r) => (
                <tr key={r.id} onClick={() => router.push(`${basePath}/payroll/${r.id}`)}
                  className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{r.user.firstName} {r.user.lastName}</p>
                    <p className="text-xs text-slate-400">{r.user.role}</p>
                  </td>
                  <td className={`px-5 py-3 text-center font-bold ${scoreColor(r.kpiScore)}`}>{r.kpiScore}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{format(r.basePay)}</td>
                  <td className="px-5 py-3 text-right text-emerald-600">{format(r.computedBonus)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-50">{format(r.netPay)}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                  <td className="px-5 py-3 text-right"><Arrow className="w-4 h-4 text-slate-300 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
