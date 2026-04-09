"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import {
  Target,
  Handshake,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  PhoneForwarded,
} from "lucide-react";

const LEAD_STATUS_COLORS = {
  NEW: "#5542F6", CONTACTED: "#3B82F6", QUALIFIED: "#20C997",
  UNQUALIFIED: "#F59E0B", CONVERTED: "#10B981", LOST: "#EF4444",
};
const LEAD_STATUS_LABELS = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified", CONVERTED: "Converted", LOST: "Lost",
};
const DEAL_STAGE_COLORS = {
  DISCOVERY: "#5542F6", PROPOSAL: "#3B82F6", NEGOTIATION: "#F59E0B",
  WON: "#20C997", LOST: "#EF4444",
};
const DEAL_STAGE_LABELS = {
  DISCOVERY: "Discovery", PROPOSAL: "Proposal", NEGOTIATION: "Negotiation",
  WON: "Won", LOST: "Lost",
};

function StatusBadge({ status, colorMap, labelMap }) {
  const colors = {
    NEW: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
    CONTACTED: "bg-blue-50 text-blue-600",
    QUALIFIED: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    UNQUALIFIED: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    CONVERTED: "bg-green-50 text-green-600",
    LOST: "bg-red-50 text-red-600",
    DISCOVERY: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
    PROPOSAL: "bg-blue-50 text-blue-600",
    NEGOTIATION: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    WON: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    PENDING: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    OVERDUE: "bg-red-50 text-red-600",
    SCHEDULED: "bg-blue-50 text-blue-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[status] || "bg-slate-50 text-slate-500"}`}>
      {(labelMap || {})[status] || status}
    </span>
  );
}

export default function SalesDashboardContent({ stats }) {
  const { user } = useAuth();
  const { format, formatCompact } = useSite();
  const userName = user?.firstName || "Sales";

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">Unable to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const s = stats;

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  /* Lead pipeline bar data */
  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"];
  const maxLeadCount = Math.max(...leadStatuses.map((st) => s.leads?.byStatus?.[st] || 0), 1);

  /* Deal pipeline bar data */
  const dealStages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
  const maxDealCount = Math.max(...dealStages.map((st) => s.deals?.byStage?.[st] || 0), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Hello, {userName}! <span className="text-xl">👋</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here&apos;s your sales pipeline overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Won Deal Value - accent card */}
        <div className="bg-[#5542F6] rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="font-medium opacity-90 text-sm">Won Deal Value</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold" suppressHydrationWarning>{formatCompact(s.deals?.wonValue || 0)}</span>
            <p className="text-xs text-indigo-200 mt-1" suppressHydrationWarning>Pipeline: {formatCompact(s.deals?.totalValue || 0)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Leads</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{s.leads?.total || 0}</span>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Deals</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{s.deals?.total || 0}</span>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Conversion Rate</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{s.deals?.conversionRate || 0}%</span>
            <p className="text-xs text-slate-400 mt-1">{s.deals?.wonCount || 0} deals won</p>
          </div>
        </div>
      </div>

      {/* Pipeline Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Lead Pipeline</h3>
            <Link href="/sales/leads" className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex items-end justify-around gap-2 h-40">
            {leadStatuses.map((status) => {
              const count = s.leads?.byStatus?.[status] || 0;
              const height = maxLeadCount > 0 ? `${Math.max((count / maxLeadCount) * 100, 3)}%` : "3%";
              return (
                <div key={status} className="flex flex-col items-center w-[14%] h-full justify-end group">
                  <span className="text-[10px] font-semibold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                  <div className="w-full rounded-t-sm" style={{ height, backgroundColor: LEAD_STATUS_COLORS[status], minHeight: "3px" }} />
                  <span className="text-[9px] text-slate-400 font-medium mt-1.5 whitespace-nowrap">{LEAD_STATUS_LABELS[status]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deal Pipeline */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Deal Pipeline</h3>
            <Link href="/sales/deals" className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex items-end justify-around gap-2 h-40">
            {dealStages.map((stage) => {
              const count = s.deals?.byStage?.[stage] || 0;
              const height = maxDealCount > 0 ? `${Math.max((count / maxDealCount) * 100, 3)}%` : "3%";
              return (
                <div key={stage} className="flex flex-col items-center w-[16%] h-full justify-end group">
                  <span className="text-[10px] font-semibold text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                  <div className="w-full rounded-t-sm" style={{ height, backgroundColor: DEAL_STAGE_COLORS[stage], minHeight: "3px" }} />
                  <span className="text-[9px] text-slate-400 font-medium mt-1.5 whitespace-nowrap">{DEAL_STAGE_LABELS[stage]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Rows */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#5542F6]" /> Recent Leads
            </h2>
            <Link href="/sales/leads" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.recentLeads?.length > 0 ? (
            <div className="space-y-3">
              {s.recentLeads.map((lead) => (
                <Link key={lead.id} href={`/sales/leads/${lead.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate group-hover:text-[#5542F6]">{lead.companyName}</h4>
                    <p className="text-xs text-slate-400">{lead.contactName}</p>
                  </div>
                  <StatusBadge status={lead.status} labelMap={LEAD_STATUS_LABELS} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No leads yet.</p>
          )}
        </div>

        {/* Recent Deals */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-[#5542F6]" /> Recent Deals
            </h2>
            <Link href="/sales/deals" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.recentDeals?.length > 0 ? (
            <div className="space-y-3">
              {s.recentDeals.map((deal) => (
                <Link key={deal.id} href={`/sales/deals/${deal.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate group-hover:text-[#5542F6]">{deal.title}</h4>
                    <p className="text-xs text-slate-400">{deal.lead?.companyName || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={deal.stage} labelMap={DEAL_STAGE_LABELS} />
                    {deal.value && <span className="text-xs font-medium text-slate-600 dark:text-slate-300" suppressHydrationWarning>{formatCompact(deal.value)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No deals yet.</p>
          )}
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <PhoneForwarded className="w-5 h-5 text-[#5542F6]" /> Upcoming Follow-ups
            </h2>
            <Link href="/sales/follow-ups" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.upcomingFollowUps?.length > 0 ? (
            <div className="space-y-3">
              {s.upcomingFollowUps.map((fu) => (
                <div key={fu.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{fu.title}</h4>
                    <p className="text-xs text-slate-400">{fu.lead?.companyName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={fu.status} />
                    <span className="text-xs text-slate-500">{formatDate(fu.dueAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming follow-ups.</p>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5542F6]" /> Upcoming Meetings
            </h2>
            <Link href="/sales/meetings" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.upcomingMeetings?.length > 0 ? (
            <div className="space-y-3">
              {s.upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{meeting.title}</h4>
                    <p className="text-xs text-slate-400">{meeting.lead?.companyName || meeting.deal?.title || "—"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(meeting.scheduledAt)}</p>
                    <p className="text-xs text-slate-400">{formatTime(meeting.scheduledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming meetings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
