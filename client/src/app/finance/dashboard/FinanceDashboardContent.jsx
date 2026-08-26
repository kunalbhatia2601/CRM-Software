"use client";

import Link from "next/link";
import {
  Wallet, TrendingUp, AlertTriangle, PieChart, ArrowRight, ReceiptText,
  Building2, CalendarDays, ArrowUpRight,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useSite } from "@/context/SiteContext";
import ExpenseTiles from "@/components/expenses/ExpenseTiles";

const STATUS_BAR = [
  { key: "draft", label: "Draft", color: "bg-slate-300 dark:bg-slate-600" },
  { key: "sent", label: "Sent", color: "bg-blue-500" },
  { key: "partiallyPaid", label: "Partially Paid", color: "bg-amber-500" },
  { key: "overdue", label: "Overdue", color: "bg-red-500" },
  { key: "paid", label: "Paid", color: "bg-emerald-500" },
];

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysLate(due) {
  if (!due) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(due).getTime()) / 86400000));
}

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
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {href && <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-3 tabular-nums">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function InvoiceRow({ inv, showDue = false }) {
  const late = daysLate(inv.dueDate);
  return (
    <Link
      href={`/finance/invoices/${inv.id}`}
      className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
            {inv.invoiceNumber}
          </span>
          <Badge value={inv.status} />
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {inv.client?.companyName || "—"}
          {inv.project?.name ? ` · ${inv.project.name}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <FmtMoney amount={showDue ? inv.due : inv.total} className="text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums" />
        <p className={`text-xs mt-0.5 ${showDue && late > 0 ? "text-red-600 font-medium" : "text-slate-400"}`}>
          {showDue && late > 0 ? `${late}d overdue` : fmtDate(inv.issueDate || inv.dueDate)}
        </p>
      </div>
    </Link>
  );
}

/** Currency via the site formatter, which knows the base currency. */
function FmtMoney({ amount, className = "" }) {
  const { format } = useSite();
  return <span className={className}>{format(Number(amount) || 0, { decimals: 0 })}</span>;
}

export default function FinanceDashboardContent({ stats }) {
  const { format } = useSite();

  // The action returns null on an auth blip or API failure — show a plain
  // message rather than a wall of zeros that reads like real data.
  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Could not load finance data. Refresh to try again.</p>
        </div>
      </div>
    );
  }

  const t = stats?.totals || {};
  const c = stats?.counts || {};
  const trend = stats?.trend || [];
  const debtors = stats?.topDebtors || [];

  // Scale bars to the busiest month so a quiet month still reads.
  const peak = Math.max(1, ...trend.map((m) => Math.max(m.billed, m.collected)));
  const maxDebt = Math.max(1, ...debtors.map((d) => d.amount));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Finance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Billing, collections and what is still owed.
        </p>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          tone="emerald"
          label="Collected all time"
          value={format(t.collected || 0, { decimals: 0 })}
          sub={`${format(t.thisMonthCollected || 0, { decimals: 0 })} this month`}
          href="/finance/invoices"
        />
        <StatCard
          icon={TrendingUp}
          tone="indigo"
          label="Outstanding"
          value={format(t.outstanding || 0, { decimals: 0 })}
          sub={`${c.sent + c.partiallyPaid || 0} invoice${(c.sent + c.partiallyPaid) === 1 ? "" : "s"} open`}
          href="/finance/invoices"
        />
        <StatCard
          icon={AlertTriangle}
          tone="red"
          label="Overdue"
          value={format(t.overdueValue || 0, { decimals: 0 })}
          sub={`${c.overdue || 0} past due date`}
          href="/finance/invoices"
        />
        <StatCard
          icon={PieChart}
          tone="amber"
          label="Collection rate"
          value={`${t.collectionRate ?? 0}%`}
          sub={`${format(t.billed || 0, { decimals: 0 })} billed`}
        />
      </div>

      {/* Invoice status mix */}
      {c.total > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
            Invoice status · {c.total} total
          </h2>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            {STATUS_BAR.map(({ key, label, color }) =>
              c[key] > 0 ? (
                <div key={key} className={color} style={{ width: `${(c[key] / c.total) * 100}%` }} title={`${label}: ${c[key]}`} />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
            {STATUS_BAR.filter(({ key }) => c[key] > 0).map(({ key, label, color }) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} /> {label} ({c[key]})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Billed vs collected, last 6 months */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#5542F6]" /> Last 6 months
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Billed</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Collected</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 h-40">
          {trend.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full flex items-end justify-center gap-1 h-32">
                <div
                  className="w-1/3 max-w-4 rounded-t bg-indigo-500 min-h-0.5 transition-all group-hover:opacity-80"
                  style={{ height: `${(m.billed / peak) * 100}%` }}
                  title={`Billed ${format(m.billed, { decimals: 0 })}`}
                />
                <div
                  className="w-1/3 max-w-4 rounded-t bg-emerald-500 min-h-0.5 transition-all group-hover:opacity-80"
                  style={{ height: `${(m.collected / peak) * 100}%` }}
                  title={`Collected ${format(m.collected, { decimals: 0 })}`}
                />
              </div>
              <span className="text-[11px] text-slate-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Who owes the most */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#5542F6]" /> Top outstanding
            </h2>
            <Link href="/finance/clients" className="text-xs text-[#5542F6] hover:underline flex items-center gap-1">
              Clients <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {debtors.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nothing outstanding. All clear.</p>
          ) : (
            <div className="space-y-3">
              {debtors.map((d) => (
                <div key={d.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700 dark:text-slate-300 truncate">{d.name}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50 tabular-nums shrink-0 ml-3">
                      {format(d.amount, { decimals: 0 })}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#5542F6] rounded-full" style={{ width: `${(d.amount / maxDebt) * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {d.invoices} open invoice{d.invoices !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Needs chasing */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue invoices
          </h2>
          {stats?.overdueInvoices?.length > 0 ? (
            <div className="flex flex-col">
              {stats.overdueInvoices.map((inv) => (
                <InvoiceRow key={inv.id} inv={inv} showDue />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">Nothing overdue.</p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-[#5542F6]" /> Recent invoices
          </h2>
          <Link href="/finance/invoices" className="text-xs text-[#5542F6] hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {stats?.recentInvoices?.length > 0 ? (
          <div className="flex flex-col">
            {stats.recentInvoices.map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-8">No invoices yet.</p>
        )}
      </div>
      <ExpenseTiles basePath="/finance" />

    </div>
  );
}
