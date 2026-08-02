"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Loader2, ChevronRight, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { useSite } from "@/context/SiteContext";
import { getMyInvoices } from "@/actions/invoices.action";

const STATUS_STYLE = {
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-400 line-through dark:bg-slate-800",
};

const FILTERS = [
  { id: "", label: "All" },
  { id: "UNPAID", label: "Unpaid" },
  { id: "PAID", label: "Paid" },
];

export default function ClientInvoicesContent() {
  const router = useRouter();
  const { format } = useSite();
  const [data, setData] = useState({ invoices: [], totals: { total: 0, paid: 0, due: 0 } });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      const res = await getMyInvoices();
      if (res.success) setData(res.data);
      setLoading(false);
    })();
  }, []);

  const invoices = useMemo(() => {
    if (filter === "PAID") return data.invoices.filter((i) => i.status === "PAID");
    if (filter === "UNPAID") return data.invoices.filter((i) => ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(i.status));
    return data.invoices;
  }, [data.invoices, filter]);

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—");

  const isOverdue = (inv) =>
    inv.dueDate && inv.status !== "PAID" && inv.status !== "CANCELLED" && new Date(inv.dueDate) < new Date();

  return (
    <div className="p-6">
      <PageHeader title="Invoices" description="All invoices for your projects." />

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Wallet, label: "Total Billed", value: data.totals.total, color: "text-slate-900 dark:text-slate-50" },
              { icon: CheckCircle2, label: "Paid", value: data.totals.paid, color: "text-emerald-600" },
              { icon: AlertCircle, label: "Outstanding", value: data.totals.due, color: "text-amber-600" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                    <Icon className="w-4 h-4" /> {s.label}
                  </div>
                  <p className={`text-xl font-bold ${s.color}`}>{format(s.value)}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          {data.invoices.length > 0 && (
            <div className="flex gap-2 mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                  <Receipt className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {data.invoices.length === 0 ? "No invoices yet." : "No invoices match this filter."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const overdue = isOverdue(inv);
                  const balance = Number(inv.total) - Number(inv.amountPaid);
                  return (
                    <button
                      key={inv.id}
                      onClick={() => router.push(`/client/invoices/${inv.id}`)}
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-slate-900 dark:text-slate-50">{inv.invoiceNumber}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLE[inv.status] || ""}`}>
                            {inv.status.replace("_", " ")}
                          </span>
                          {overdue && inv.status !== "OVERDUE" && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-100 text-red-700">Past due</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {inv.project?.name || "—"} · Issued {fmtDate(inv.issueDate)}
                          {inv.dueDate ? ` · Due ${fmtDate(inv.dueDate)}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">{format(inv.total)}</p>
                        {balance > 0 && inv.status !== "CANCELLED" && (
                          <p className="text-xs text-amber-600">{format(balance)} due</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
