"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Wallet, TrendingUp, CalendarDays, ChevronRight } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getPayrollHistory } from "@/actions/payroll.action";

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

export default function PayrollHistory({ basePath = "/hr", userId }) {
  const router = useRouter();
  const { format } = useSite();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getPayrollHistory(userId);
      if (res.success) setData(res.data);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!data?.user) return <div className="p-6"><p className="text-slate-500">User not found.</p></div>;

  const u = data.user;
  const t = data.totals;

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => router.push(`${basePath}/employees/${userId}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Profile
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-4">
          {u.avatar ? <img src={u.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover" />
            : <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">{u.firstName?.[0]}{u.lastName?.[0]}</div>}
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{u.firstName} {u.lastName}</h1>
            <p className="text-sm text-slate-400">Payroll history · joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
          </div>
        </div>
      </div>

      {/* Lifetime totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: CalendarDays, label: "Months paid", value: t.months },
          { icon: TrendingUp, label: "Avg KPI", value: data.avgKpi, color: scoreColor(data.avgKpi) },
          { icon: Wallet, label: "Lifetime net", value: format(t.net) },
          { icon: Wallet, label: "Total disbursed", value: format(t.paid) },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <Icon className="w-4 h-4 text-slate-400 mb-2" />
              <p className="text-[11px] text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className={`text-lg font-bold ${s.color || "text-slate-900 dark:text-slate-50"}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly records */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {data.records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">No payroll records yet. Generate a month from the Payroll page.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Month</th>
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
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-50">{MONTHS[r.month - 1]} {r.year}</td>
                  <td className={`px-5 py-3 text-center font-bold ${scoreColor(r.kpiScore)}`}>{r.kpiScore}</td>
                  <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{format(r.basePay)}</td>
                  <td className="px-5 py-3 text-right text-emerald-600">{format(r.computedBonus)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-50">{format(r.netPay)}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                  <td className="px-5 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
