"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wallet, TrendingUp, TrendingDown, ReceiptText, Briefcase, Clock, Megaphone, Scale, Loader2,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getFinanceDashboardStats } from "@/actions/dashboard.action";

const PRESETS = [
  { id: "all", label: "All time" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom range" },
];

const iso = (d) => d.toISOString().slice(0, 10);

function StatCard({ icon: Icon, label, value, sub, tone = "slate", href }) {
  const tones = {
    slate: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    red: "text-red-600 bg-red-50 dark:bg-red-900/20",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
  };
  const body = (
    <div className="h-full bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-3 tabular-nums">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/**
 * P&L block for the Owner Dashboard — same figures, same math, same visuals
 * as the Finance dashboard's own P&L section (both read `pnl` off the same
 * `getFinanceDashboardStats` response), just with its own All time/This
 * month/This year/Custom range picker so it doesn't get tangled with the
 * leads/deals period selector above it on this page.
 */
export default function FinancePnlSection() {
  const { format } = useSite();
  const [stats, setStats] = useState(null);
  const [preset, setPreset] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (params) => {
    setLoading(true);
    const res = await getFinanceDashboardStats(params);
    if (res) setStats(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    load({ preset: "all" });
  }, [load]);

  const applyPreset = (id) => {
    setPreset(id);
    if (id !== "custom") load({ preset: id });
  };

  useEffect(() => {
    if (preset !== "custom" || !from || !to) return;
    load({ preset: "custom", from, to });
  }, [preset, from, to, load]);

  const pnl = stats?.pnl || null;

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 lg:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Finance</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Profit &amp; loss, and where the cost goes.</p>
        </div>
        <Link href="/finance/dashboard" className="text-xs font-medium text-[#5542F6] hover:underline shrink-0">
          Full finance dashboard →
        </Link>
      </div>

      {/* Period */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                preset === p.id
                  ? "bg-[#5542F6] text-white border-[#5542F6]"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date" max={to || iso(new Date())} value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-50 outline-none focus:ring-2 focus:ring-[#5542F6]"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date" min={from} max={iso(new Date())} value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-50 outline-none focus:ring-2 focus:ring-[#5542F6]"
            />
            {(!from || !to) && <span className="text-[11px] text-slate-400">Pick both dates</span>}
          </div>
        )}

        <span className="ml-auto text-xs text-slate-400 flex items-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Showing <b className="text-slate-600 dark:text-slate-300">{stats?.range?.label || "All time"}</b>
        </span>
      </div>

      {!pnl ? (
        <div className="py-10 text-center">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
          ) : (
            <p className="text-sm text-slate-400">Could not load finance data.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Briefcase}
              tone="indigo"
              label="Contracted income"
              value={format(pnl.income.contracted, { decimals: 0 })}
              sub={`${pnl.income.projectCount} project${pnl.income.projectCount === 1 ? "" : "s"} · ${format(pnl.income.unbilled, { decimals: 0 })} not yet invoiced`}
            />
            <StatCard
              icon={ReceiptText}
              tone="slate"
              label="Invoiced income"
              value={format(pnl.income.billed, { decimals: 0 })}
              sub={`${format(pnl.income.collected, { decimals: 0 })} received · ${format(pnl.income.receivable, { decimals: 0 })} owed`}
              href="/owner/invoices"
            />
            <StatCard
              icon={Wallet}
              tone="amber"
              label="Total expenses"
              value={format(pnl.cost.total, { decimals: 0 })}
              sub="Claims + team time + ad spend"
            />
            <StatCard
              icon={pnl.profit.billedProfit >= 0 ? TrendingUp : TrendingDown}
              tone={pnl.profit.billedProfit >= 0 ? "emerald" : "red"}
              label="Profit on invoiced"
              value={format(pnl.profit.billedProfit, { decimals: 0 })}
              sub={pnl.profit.billedMargin === null ? "nothing invoiced yet" : `${pnl.profit.billedMargin}% margin`}
            />
          </div>

          {/* Where the cost actually goes, and the three profit readings */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#5542F6]" /> Cost breakdown
              </h3>
              {(() => {
                const rows = [
                  { label: "Staff expense claims", value: pnl.cost.expenses, icon: ReceiptText, color: "bg-[#5542F6]" },
                  { label: "Team time on tasks", value: pnl.cost.taskCost, icon: Clock, color: "bg-emerald-500" },
                  { label: "Ad spend", value: pnl.cost.adSpend, icon: Megaphone, color: "bg-amber-500" },
                ];
                const max = Math.max(1, ...rows.map((r) => r.value));
                return (
                  <div className="space-y-3">
                    {rows.map(({ label, value, icon: Icon, color }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                            {format(value, { decimals: 0 })}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">Total</span>
                      <span className="font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                        {format(pnl.cost.total, { decimals: 0 })}
                      </span>
                    </div>
                    {pnl.cost.expensesPending > 0 && (
                      <p className="text-[11px] text-amber-600">
                        {format(pnl.cost.expensesPending, { decimals: 0 })} in claims awaiting approval, not counted above.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#5542F6]" /> Profit &amp; loss
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Realised", hint: "money received − cost", value: pnl.profit.realised, margin: pnl.profit.realisedMargin },
                  { label: "On invoiced", hint: "invoiced − cost", value: pnl.profit.billedProfit, margin: pnl.profit.billedMargin },
                  { label: "Projected", hint: "full contract book − cost", value: pnl.profit.projected, margin: pnl.profit.projectedMargin },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.label}</p>
                      <p className="text-[11px] text-slate-400">{r.hint}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold tabular-nums ${r.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {format(r.value, { decimals: 0 })}
                      </p>
                      {r.margin !== null && (
                        <p className="text-[11px] text-slate-400">{r.margin}% margin</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Realised is the honest cash position; projected assumes every project bills in full.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
