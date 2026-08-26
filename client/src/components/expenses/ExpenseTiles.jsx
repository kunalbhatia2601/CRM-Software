"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import {
  Receipt, Wallet, Clock, FolderKanban, ArrowRight, ArrowUpRight, Loader2,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useSite } from "@/context/SiteContext";
import { useAuth } from "@/context/AuthContext";
import { getExpenseStats } from "@/actions/expenses.action";

// Project-attributed spend is company-wide financial data.
const PROJECT_TILE_ROLES = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

function Tile({ icon: Icon, label, value, sub, tone = "slate", href }) {
  const tones = {
    slate: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
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

/**
 * Expense summary for a role's dashboard.
 *
 * The server decides what it returns — approvers get the queue, finance gets
 * the liability, everyone gets their own position. This only renders what came
 * back, so a role never sees a tile it has no data for.
 *
 * @param {string} basePath role base, e.g. "/owner"
 */
export default function ExpenseTiles({ basePath = "/owner" }) {
  const { format } = useSite();
  // Read the role from auth rather than a prop, so a dashboard cannot claim a
  // role its viewer does not actually hold.
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpenseStats().then((res) => {
      if (res.success) setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!stats) return null;

  const money = (n) => format(n || 0, { decimals: 0 });
  const showProjectTile = PROJECT_TILE_ROLES.includes(user?.role) && stats.projectSpend;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#5542F6]" /> Expenses
        </h2>
        <Link href={`${basePath}/expenses`} className="text-xs text-[#5542F6] hover:underline flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.pendingApproval && (
          <Tile
            icon={Clock}
            tone="amber"
            label="Awaiting your approval"
            value={stats.pendingApproval.count}
            sub={money(stats.pendingApproval.amount)}
            href={`${basePath}/expenses`}
          />
        )}

        {stats.owedToStaff && (
          <Tile
            icon={Wallet}
            tone="indigo"
            label="Owed to staff"
            value={money(stats.owedToStaff.amount)}
            sub={`${stats.owedToStaff.count} approved, not yet paid`}
            href={`${basePath}/expenses`}
          />
        )}

        {stats.monthSpend !== null && stats.monthSpend !== undefined && (
          <Tile
            icon={Receipt}
            tone="slate"
            label="Spend this month"
            value={money(stats.monthSpend)}
            sub="Approved and settled"
          />
        )}

        {showProjectTile && (
          <Tile
            icon={FolderKanban}
            tone="emerald"
            label="Project-linked spend"
            value={money(stats.projectSpend.total)}
            sub={`${money(stats.projectSpend.billable)} rechargeable · ${stats.projectSpend.billableCount} claim${stats.projectSpend.billableCount === 1 ? "" : "s"}`}
            href={`${basePath}/expenses`}
          />
        )}

        {/* Everyone sees their own position. */}
        <Tile
          icon={Wallet}
          tone={stats.mine.amount > 0 ? "amber" : "slate"}
          label="Your pending reimbursement"
          value={money(stats.mine.amount)}
          sub={
            stats.mine.count > 0
              ? `${stats.mine.count} claim${stats.mine.count === 1 ? "" : "s"} in progress`
              : stats.mine.paidThisMonth > 0
                ? `${money(stats.mine.paidThisMonth)} reimbursed this month`
                : "Nothing outstanding"
          }
          href={`${basePath}/expenses`}
        />
      </div>

      {/* Queue for approvers, own recent claims for everyone else */}
      {stats.recent?.length > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
            {stats.canApprove ? "Waiting on you" : "Your recent claims"}
          </h3>
          <div className="flex flex-col">
            {stats.recent.map((e) => {
              const Icon = LucideIcons[e.category?.icon] || Receipt;
              return (
                <Link
                  key={e.id}
                  href={`${basePath}/expenses`}
                  className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{e.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {e.category?.name}
                      {stats.canApprove && e.submittedBy ? ` · ${e.submittedBy.firstName} ${e.submittedBy.lastName}` : ""}
                    </p>
                  </div>
                  <Badge value={e.status} />
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums shrink-0">
                    {money(e.totalAmount)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
