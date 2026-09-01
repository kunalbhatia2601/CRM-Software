"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2, Download, ReceiptText, Wallet, Clock, Megaphone, FileText,
  TrendingUp, TrendingDown, Scale, AlertCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { getProjectLedger } from "@/actions/projects.action";

// Project financials.
const VISIBLE_TO = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

/** Every stream, and how it reads in the table and the export. */
const KINDS = [
  { id: "INVOICE",   label: "Invoices",         icon: FileText,    dir: "IN",  color: "text-slate-600", note: "billed, not cash" },
  { id: "PAYMENT",   label: "Payments received", icon: ReceiptText, dir: "IN",  color: "text-emerald-600" },
  { id: "EXPENSE",   label: "Expenses",          icon: Wallet,      dir: "OUT", color: "text-amber-600" },
  { id: "TASK_COST", label: "Internal costing",  icon: Clock,       dir: "OUT", color: "text-indigo-600" },
  { id: "AD_SPEND",  label: "Ad spend",          icon: Megaphone,   dir: "OUT", color: "text-orange-600" },
];

const ALL_KINDS = KINDS.map((k) => k.id);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** RFC-4180 enough: quote everything, double inner quotes. */
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/**
 * Full financial history of a project — what was billed, what came in, and
 * everything it cost to deliver.
 *
 * @param {string} projectId
 */
export default function ProjectLedger({ projectId }) {
  const { user } = useAuth();
  const { format } = useSite();
  const money = (n) => format(Number(n) || 0, { decimals: 0 });

  const allowed = VISIBLE_TO.includes(user?.role);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(ALL_KINDS);

  useEffect(() => {
    if (!allowed) { setLoading(false); return; }
    getProjectLedger(projectId).then((res) => {
      if (res.success) setData(res.data);
      setLoading(false);
    });
  }, [projectId, allowed]);

  const rows = useMemo(
    () => (data?.entries || []).filter((e) => selected.includes(e.kind)),
    [data, selected]
  );

  // Totals reflect the current selection, so a filtered view still adds up.
  const shown = useMemo(() => {
    const inTotal = rows.filter((r) => r.direction === "IN" && r.kind !== "INVOICE")
      .reduce((s, r) => s + r.amount, 0);
    const outTotal = rows.filter((r) => r.direction === "OUT").reduce((s, r) => s + r.amount, 0);
    const billedTotal = rows.filter((r) => r.kind === "INVOICE").reduce((s, r) => s + r.amount, 0);
    return { inTotal, outTotal, billedTotal, net: inTotal - outTotal };
  }, [rows]);

  if (!allowed) return null;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!data) return null;

  const { summary } = data;

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));

  const download = () => {
    const header = ["Date", "Type", "Description", "Detail", "Person", "Direction", "Amount", "Running balance"];
    const lines = rows.map((r) => [
      new Date(r.date).toISOString().slice(0, 10),
      KINDS.find((k) => k.id === r.kind)?.label || r.kind,
      r.title,
      r.detail || "",
      r.by || "",
      r.kind === "INVOICE" ? "BILLED" : r.direction,
      r.amount.toFixed(2),
      r.balance.toFixed(2),
    ]);

    const totals = [
      [],
      ["Billed (invoices)", "", "", "", "", "", shown.billedTotal.toFixed(2)],
      ["Received", "", "", "", "", "", shown.inTotal.toFixed(2)],
      ["Costs", "", "", "", "", "", shown.outTotal.toFixed(2)],
      ["Net (received − costs)", "", "", "", "", "", shown.net.toFixed(2)],
    ];

    const csv = [header, ...lines, ...totals].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${data.project.name.replace(/[^a-z0-9]+/gi, "-")}-ledger.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const ProfitRow = ({ label, hint, value, margin }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-[11px] text-slate-400">{hint}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold tabular-nums ${value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
          {money(value)}
        </p>
        {margin !== null && <p className="text-[11px] text-slate-400">{margin}% margin</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Position */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Contracted", value: summary.contracted, sub: `${money(summary.unbilled)} not yet invoiced`, tone: "slate" },
          { label: "Invoiced", value: summary.billed, sub: `${money(summary.receivable)} still owed`, tone: "slate" },
          { label: "Received", value: summary.collected, sub: "money in the bank", tone: "emerald" },
          { label: "Total cost", value: summary.cost.total, sub: "expenses + time + ads", tone: "amber" },
        ].map((c) => (
          <div key={c.label} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-xl font-bold tabular-nums mt-1 ${
              c.tone === "emerald" ? "text-emerald-600" : c.tone === "amber" ? "text-amber-600" : "text-slate-900 dark:text-slate-50"
            }`}>
              {money(c.value)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Cost split */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#5542F6]" /> What it cost
          </h3>
          {(() => {
            const parts = [
              { label: "Expense claims", value: summary.cost.expenses, color: "bg-amber-500" },
              { label: "Team time", value: summary.cost.taskCost, color: "bg-indigo-500" },
              { label: "Ad spend", value: summary.cost.adSpend, color: "bg-orange-500" },
            ];
            const max = Math.max(1, ...parts.map((p) => p.value));
            return (
              <div className="space-y-3">
                {parts.map((p) => (
                  <div key={p.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-300">{p.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{money(p.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${p.color}`} style={{ width: `${(p.value / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {summary.cost.pendingExpenses > 0 && (
                  <p className="text-[11px] text-amber-600 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    {money(summary.cost.pendingExpenses)} in claims awaiting approval, not counted.
                  </p>
                )}
              </div>
            );
          })()}
        </div>

        {/* Is it profitable? */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            {summary.profit.billedProfit >= 0
              ? <TrendingUp className="w-4 h-4 text-emerald-600" />
              : <TrendingDown className="w-4 h-4 text-red-600" />}
            Profitability
          </h3>
          <ProfitRow label="Realised" hint="received − cost" value={summary.profit.realised} margin={summary.profit.realisedMargin} />
          <ProfitRow label="On invoiced" hint="invoiced − cost" value={summary.profit.billedProfit} margin={summary.profit.billedMargin} />
          <ProfitRow label="Projected" hint="full contract − cost" value={summary.profit.projected} margin={summary.profit.projectedMargin} />
        </div>
      </div>

      {/* Filters + export */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {KINDS.map(({ id, label, icon: Icon, note }) => {
            const count = (data.entries || []).filter((e) => e.kind === id).length;
            return (
              <label key={id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-[#5542F6]"
                  checked={selected.includes(id)}
                  onChange={() => toggle(id)}
                />
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                {label}
                <span className="text-xs text-slate-400">({count})</span>
                {note && <span className="text-[10px] text-slate-400 italic">{note}</span>}
              </label>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSelected(selected.length === ALL_KINDS.length ? [] : ALL_KINDS)}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {selected.length === ALL_KINDS.length ? "Clear all" : "Select all"}
            </button>
            <button
              onClick={download}
              disabled={rows.length === 0}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-lg hover:bg-[#4636d4] disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Download CSV
            </button>
          </div>
        </div>

        {/* Totals for whatever is ticked */}
        {rows.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {shown.billedTotal > 0 && (
              <span className="text-slate-500">Billed <b className="text-slate-900 dark:text-slate-50">{money(shown.billedTotal)}</b></span>
            )}
            <span className="text-slate-500">Received <b className="text-emerald-600">{money(shown.inTotal)}</b></span>
            <span className="text-slate-500">Costs <b className="text-amber-600">{money(shown.outTotal)}</b></span>
            <span className="text-slate-500">
              Net <b className={shown.net >= 0 ? "text-emerald-600" : "text-red-600"}>{money(shown.net)}</b>
            </span>
          </div>
        )}
      </div>

      {/* The ledger itself */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-12">
            {data.entries.length === 0
              ? "Nothing recorded against this project yet."
              : "Nothing matches the selected types."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-2 font-semibold">Type</th>
                  <th className="py-2.5 px-2 font-semibold">Description</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Amount</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const kind = KINDS.find((k) => k.id === r.kind);
                  const Icon = kind?.icon || FileText;
                  const isBooking = r.kind === "INVOICE";
                  return (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                      <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{fmtDate(r.date)}</td>
                      <td className="py-2.5 px-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${kind?.color || "text-slate-500"}`}>
                          <Icon className="w-3.5 h-3.5" /> {kind?.label || r.kind}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-50 truncate">{r.title}</p>
                        {(r.detail || r.by) && (
                          <p className="text-[11px] text-slate-400 truncate">
                            {[r.detail, r.by].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className={`py-2.5 px-2 text-right tabular-nums font-medium whitespace-nowrap ${
                        isBooking ? "text-slate-400" : r.direction === "IN" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {isBooking ? "" : r.direction === "IN" ? "+" : "−"}{money(r.amount)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums text-slate-500 whitespace-nowrap">
                        {isBooking ? "—" : money(r.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-400">
        Invoices are shown as bookings, not cash — only payments move the running balance.
      </p>
    </div>
  );
}
