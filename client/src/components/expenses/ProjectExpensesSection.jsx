"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { Receipt, Loader2, ArrowRight, RefreshCw, AlertCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { getProjectExpenseSummary } from "@/actions/expenses.action";

// Project spend is company financial data.
const VISIBLE_TO = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

const CYCLE_LABEL = {
  MONTHLY: "month", QUARTERLY: "quarter", SEMI_ANNUAL: "half-year", ANNUAL: "year",
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

/**
 * Expense spend on one project.
 *
 * Recurring projects get a per-billing-period breakdown, because a lifetime
 * figure on a long retainer is not a number anyone can act on.
 *
 * @param {string} projectId
 * @param {string} basePath  role base for links, e.g. "/owner"
 */
export default function ProjectExpensesSection({ projectId, basePath = "/owner" }) {
  const { user } = useAuth();
  const { format } = useSite();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const allowed = VISIBLE_TO.includes(user?.role);

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    getProjectExpenseSummary(projectId).then((res) => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, [projectId, allowed]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!data) return null;

  const money = (n) => format(n || 0, { decimals: 0 });
  const { periods = [], currentPeriod, isRecurring, byCategory = [] } = data;

  // Scale bars against the busiest period so a quiet one still reads.
  const peak = Math.max(1, ...periods.map((p) => p.total ?? p.amount));
  const maxCat = Math.max(1, ...byCategory.map((c) => c.amount));

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 p-6 lg:p-8 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Project Cost</h3>
            <p className="text-xs text-slate-400">
              Team time and claimed spend
              {isRecurring && (
                <span className="inline-flex items-center gap-1 ml-2 text-emerald-600">
                  <RefreshCw className="w-3 h-3" /> per {CYCLE_LABEL[data.project.billingCycle]}
                </span>
              )}
            </p>
          </div>
        </div>
        <Link href={`${basePath}/expenses`} className="text-xs text-[#5542F6] hover:underline flex items-center gap-1 shrink-0">
          All expenses <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {data.count === 0 && data.pending === 0 && !(data.taskCost?.total > 0) ? (
        <p className="text-sm text-slate-400 italic">
          No cost recorded yet — set internal costing on tasks, or claim an expense against this project.
        </p>
      ) : (
        <>
          {/* Cost, and what it earned */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Team time
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1 tabular-nums">
                {money(data.taskCost?.total)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {data.taskCost?.hours ?? 0}h across {data.taskCost?.taskCount ?? 0} task
                {data.taskCost?.taskCount === 1 ? "" : "s"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Expenses
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1 tabular-nums">
                {money(data.total)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {data.count} claim{data.count === 1 ? "" : "s"}
                {data.pending > 0 ? ` · ${money(data.pending)} pending` : ""}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#5542F6] text-white">
              <p className="text-xs text-indigo-200">
                {isRecurring ? `Cost this ${CYCLE_LABEL[data.project.billingCycle]}` : "Total cost"}
              </p>
              <p className="text-xl font-bold mt-1 tabular-nums">
                {money(isRecurring ? currentPeriod?.total : data.totals?.cost)}
              </p>
              {isRecurring && (
                <p className="text-[11px] text-indigo-200 mt-0.5">{money(data.totals?.cost)} lifetime</p>
              )}
            </div>

            <div
              className={`p-4 rounded-2xl ${
                (data.totals?.margin ?? 0) >= 0
                  ? "bg-emerald-50/60 dark:bg-emerald-900/10"
                  : "bg-red-50/60 dark:bg-red-900/10"
              }`}
            >
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                {(data.totals?.margin ?? 0) >= 0
                  ? <TrendingUp className="w-3.5 h-3.5" />
                  : <TrendingDown className="w-3.5 h-3.5" />}
                Margin
              </p>
              <p
                className={`text-xl font-bold mt-1 tabular-nums ${
                  (data.totals?.margin ?? 0) >= 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {data.totals?.billed > 0 ? money(data.totals.margin) : "—"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {data.totals?.billed > 0
                  ? `${data.totals.marginPct}% of ${money(data.totals.billed)} billed`
                  : "Nothing invoiced yet"}
              </p>
            </div>
          </div>

          {/* Rechargeable spend still sitting on our books */}
          {data.unbilledTotal > 0 && (
            <div className="mb-6 flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-200">
                <b>{money(data.unbilledTotal)}</b> of rechargeable spend has not been invoiced to the client yet
                {data.billableTotal > data.unbilledTotal
                  ? ` (${money(data.billableTotal)} rechargeable in total).`
                  : "."}
              </p>
            </div>
          )}

          {/* Per-period spend — only meaningful for a recurring project */}
          {isRecurring && periods.length > 1 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Cost per billing period
              </p>
              <div className="flex items-end justify-between gap-2 h-28">
                {periods.map((p) => (
                  <div key={p.label} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full flex items-end justify-center h-20">
                      <div
                        className={`w-2/3 max-w-6 rounded-t min-h-0.5 transition-all group-hover:opacity-80 ${
                          p.isCurrent ? "bg-[#5542F6]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                        style={{ height: `${((p.total ?? p.amount) / peak) * 100}%` }}
                        title={`${p.label}: ${money(p.total ?? p.amount)} — ${money(p.taskAmount)} time + ${money(p.amount)} expenses`}
                      />
                    </div>
                    <span className={`text-[10px] text-center leading-tight ${p.isCurrent ? "text-[#5542F6] font-semibold" : "text-slate-400"}`}>
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
              {periods.length === 12 && (
                <p className="text-[11px] text-slate-400 mt-2">Showing the last 12 periods.</p>
              )}
            </div>
          )}

          {/* Where the money went */}
          {byCategory.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">By category</p>
              <div className="space-y-2.5">
                {byCategory.map((c) => {
                  const Icon = LucideIcons[c.icon] || Receipt;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {c.name}
                          <span className="text-xs text-slate-400">({c.count})</span>
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50 tabular-nums shrink-0 ml-3">
                          {money(c.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(c.amount / maxCat) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Where the time went */}
          {data.taskCost?.top?.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Most expensive tasks
              </p>
              <div className="flex flex-col">
                {data.taskCost.top.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{t.title}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {t.hours}h
                        {t.assignee ? ` · ${t.assignee.firstName} ${t.assignee.lastName}` : ""}
                      </p>
                    </div>
                    {t.running && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20 shrink-0">
                        running
                      </span>
                    )}
                    <Badge value={t.status} />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums shrink-0">
                      {money(t.cost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest claims */}
          {data.recent?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Recent</p>
              <div className="flex flex-col">
                {data.recent.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{e.title}</p>
                      <p className="text-xs text-slate-400 truncate">
                        <span className="font-mono">{e.reference}</span> · {e.category?.name} · {fmtDate(e.expenseDate)}
                        {e.submittedBy ? ` · ${e.submittedBy.firstName} ${e.submittedBy.lastName}` : ""}
                      </p>
                    </div>
                    {e.isBillable && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 shrink-0">
                        {e.invoiceId ? "Invoiced" : "Billable"}
                      </span>
                    )}
                    <Badge value={e.status} />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums shrink-0">
                      {money(e.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
