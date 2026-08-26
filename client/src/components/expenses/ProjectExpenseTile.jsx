"use client";

import { useState, useEffect } from "react";
import { Receipt, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { getProjectExpenseSummary } from "@/actions/expenses.action";

// Project spend is company financial data.
const VISIBLE_TO = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

const CYCLE_LABEL = {
  MONTHLY: "month", QUARTERLY: "quarter", SEMI_ANNUAL: "half-year", ANNUAL: "year",
};

/**
 * Project cost for the detail page's top row, styled to match DetailCard.
 *
 * Cost is team time (task internal costing) plus claimed expenses — reporting
 * only one half would understate what a project actually costs to deliver.
 *
 * On a recurring project the headline is the *current billing period*, with the
 * lifetime figure underneath: a two-year retainer's lifetime total on its own
 * is not something anyone can act on.
 *
 * @param {string} projectId
 */
export default function ProjectExpenseTile({ projectId }) {
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

  const shell =
    "rounded-[24px] p-6 flex flex-col justify-between min-h-[140px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none";

  if (loading) {
    return (
      <div className={`${shell} items-center justify-center`}>
        <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
      </div>
    );
  }
  if (!data) return null;

  const money = (n) => format(n || 0, { decimals: 0 });
  const recurring = data.isRecurring;
  const taskCost = data.taskCost?.total || 0;
  const totals = data.totals || {};

  // Per-period figures already combine both streams server-side.
  const headline = recurring ? data.currentPeriod?.total ?? 0 : totals.cost ?? 0;

  const subtext = recurring
    ? `${money(totals.cost)} lifetime`
    : `${money(taskCost)} time + ${money(data.total)} expenses`;

  return (
    <div className={shell}>
      <div className="flex justify-between items-start">
        <span className="font-medium text-sm text-slate-600 dark:text-slate-400">
          {recurring ? `Cost this ${CYCLE_LABEL[data.project.billingCycle]}` : "Project cost"}
        </span>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400">
          <Receipt className="w-4 h-4" />
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">
          {money(headline)}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>

        {/* Only surface what needs acting on. */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {totals.marginPct !== null && totals.marginPct !== undefined && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                totals.margin >= 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20"
                  : "bg-red-50 text-red-700 dark:bg-red-900/20"
              }`}
            >
              {totals.marginPct}% margin
            </span>
          )}
          {data.pending > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20">
              {money(data.pending)} pending
            </span>
          )}
          {data.unbilledTotal > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20">
              {money(data.unbilledTotal)} to recharge
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
