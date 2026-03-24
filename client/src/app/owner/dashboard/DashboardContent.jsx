"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import { getDashboardStats } from "@/actions/dashboard.action";
import {
  ChevronDown,
  Calendar,
  ArrowUpRight,
  Target,
  Handshake,
  Building2,
  FolderKanban,
  UsersRound,
  Loader2,
  Check,
} from "lucide-react";

/* ─── Period Options ─── */
const PERIODS = [
  { value: "month", label: "This Month", subtitle: "this month" },
  { value: "year", label: "This Year", subtitle: "this year" },
  { value: "today", label: "Today", subtitle: "today" },
  { value: "all", label: "Till Date", subtitle: "total" },
];

/* ─── Change Tags ─── */

function ChangeTag({ value }) {
  if (value === null || value === undefined) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isPositive
          ? "bg-emerald-400/20 text-emerald-500"
          : "bg-red-50 text-red-500"
      }`}
    >
      {isPositive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

function ChangeTagLight({ value }) {
  if (value === null || value === undefined) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isPositive
          ? "bg-emerald-400/20 text-emerald-300"
          : "bg-red-400/20 text-red-300"
      }`}
    >
      {isPositive ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

/* ─── Color Maps ─── */

const LEAD_STATUS_COLORS = {
  NEW: "#5542F6",
  CONTACTED: "#3B82F6",
  QUALIFIED: "#20C997",
  UNQUALIFIED: "#F59E0B",
  CONVERTED: "#10B981",
  LOST: "#EF4444",
};

const LEAD_STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
  LOST: "Lost",
};

const PROJECT_STATUS_COLORS = {
  NOT_STARTED: "#5542F6",
  IN_PROGRESS: "#3B82F6",
  ON_HOLD: "#F59E0B",
  COMPLETED: "#20C997",
  CANCELLED: "#EF4444",
};

const PROJECT_STATUS_LABELS = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const DEAL_STAGE_COLORS = {
  DISCOVERY: "#5542F6",
  PROPOSAL: "#3B82F6",
  NEGOTIATION: "#F59E0B",
  WON: "#20C997",
  LOST: "#EF4444",
};

const DEAL_STAGE_LABELS = {
  DISCOVERY: "Discovery",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

/* ─── Main Component ─── */

export default function DashboardContent({ stats: initialStats }) {
  const { user } = useAuth();
  const { format, formatCompact } = useSite();
  const userName = user?.firstName || "Owner";

  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setDropdownOpen(false);
    startTransition(async () => {
      const result = await getDashboardStats(newPeriod);
      if (result) setStats(result);
    });
  };

  const currentPeriod = PERIODS.find((p) => p.value === period) || PERIODS[0];

  // Fallback
  const s = stats || {
    period: "month",
    hasComparison: true,
    users: { total: 0, active: 0 },
    leads: { total: 0, previous: 0, change: 0, byStatus: {} },
    deals: {
      total: 0,
      previous: 0,
      change: 0,
      byStage: {},
      totalValue: 0,
      wonValue: 0,
      wonValueChange: 0,
    },
    clients: { total: 0, active: 0, previous: 0, change: 0 },
    projects: { total: 0, previous: 0, change: null, byStatus: {} },
    recentLeads: [],
    recentDeals: [],
  };

  const periodSubtitle = currentPeriod.subtitle;

  // Subtitle text for the header
  const headerSubtitle = period === "all"
    ? "Here's your agency performance till date."
    : period === "year"
      ? `Here's your agency performance in ${new Date().getFullYear()}.`
      : period === "today"
        ? "Here's what happened across your agency today."
        : "Here's what's happening across your agency this month.";

  /* ── Lead pipeline data for bar chart ── */
  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"];
  const maxLeadCount = Math.max(
    ...leadStatuses.map((st) => s.leads.byStatus[st] || 0),
    1
  );

  /* ── Project donut ── */
  const projectStatuses = ["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];
  const projectTotal = s.projects.total || 1;
  const projectSlices = projectStatuses
    .map((st) => ({
      status: st,
      count: s.projects.byStatus[st] || 0,
      pct: (((s.projects.byStatus[st] || 0) / projectTotal) * 100).toFixed(1),
      color: PROJECT_STATUS_COLORS[st],
      label: PROJECT_STATUS_LABELS[st],
    }))
    .filter((sl) => sl.count > 0);

  let conicStops = [];
  let cumulative = 0;
  projectSlices.forEach((sl) => {
    const start = cumulative;
    cumulative += parseFloat(sl.pct);
    conicStops.push(`${sl.color} ${start}% ${cumulative}%`);
  });
  const conicGradient =
    conicStops.length > 0
      ? `conic-gradient(${conicStops.join(", ")})`
      : "conic-gradient(#e2e8f0 0% 100%)";

  /* ── Deal pipeline data for bar chart ── */
  const dealStages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
  const maxDealCount = Math.max(
    ...dealStages.map((st) => s.deals.byStage[st] || 0),
    1
  );

  return (
    <div className={`flex flex-col gap-8 w-full transition-opacity duration-200 ${isPending ? "opacity-60" : ""}`}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            Hello, {userName}! <span className="text-2xl">👋</span>
          </h1>
          <p className="text-slate-500 mt-1">{headerSubtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/50 hover:bg-slate-50 transition-colors min-w-[140px]"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              ) : (
                <Calendar className="w-4 h-4 text-slate-400" />
              )}
              {currentPeriod.label}
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 py-2 z-50 overflow-hidden">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handlePeriodChange(p.value)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      period === p.value
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                    {period === p.value && <Check className="w-4 h-4 text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* ═══════ ROW 1: 4 Stat Cards ═══════ */}

        {/* Card 1: Won Deal Value (Purple accent card) */}
        <div className="col-span-1 bg-[#5542F6] rounded-[24px] p-6 text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-medium opacity-90">Won Deal Value</span>
            <button className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:bg-indigo-50 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-bold" suppressHydrationWarning>
                {formatCompact(s.deals.wonValue)}
              </span>
              <ChangeTagLight value={s.deals.wonValueChange} />
            </div>
            <p className="text-xs text-indigo-200" suppressHydrationWarning>
              Total pipeline: {formatCompact(s.deals.totalValue)}
            </p>
          </div>
        </div>

        {/* Card 2: Leads */}
        <div className="col-span-1 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-medium text-slate-600">Leads</span>
            <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
              <Target className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-bold text-slate-900">
                {s.leads.total}
              </span>
              <ChangeTag value={s.leads.change} />
            </div>
            <p className="text-xs text-slate-400">
              {s.leads.total} {periodSubtitle}
              {s.leads.previous !== null && s.leads.previous !== undefined && (
                <span> · {s.leads.previous} prev</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 3: Deals */}
        <div className="col-span-1 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-medium text-slate-600">Deals</span>
            <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
              <Handshake className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-bold text-slate-900">
                {s.deals.total}
              </span>
              <ChangeTag value={s.deals.change} />
            </div>
            <p className="text-xs text-slate-400">
              {s.deals.total} {periodSubtitle}
              {s.deals.previous !== null && s.deals.previous !== undefined && (
                <span> · {s.deals.previous} prev</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Active Clients */}
        <div className="col-span-1 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <span className="font-medium text-slate-600">Active Clients</span>
            <button className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors">
              <Building2 className="w-4 h-4" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-bold text-slate-900">
                {s.clients.active}
              </span>
              <ChangeTag value={s.clients.change} />
            </div>
            <p className="text-xs text-slate-400">
              {s.clients.total} new {periodSubtitle}
            </p>
          </div>
        </div>

        {/* ═══════ ROW 2: Lead Pipeline + Deal Pipeline ═══════ */}

        {/* Lead Pipeline Bar Chart */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-baseline gap-4">
              <h3 className="text-lg font-bold text-slate-900">Lead Pipeline</h3>
              <span className="text-xs text-slate-400">By status</span>
            </div>
            <button className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 h-48 relative">
            <div className="absolute inset-0 flex flex-col justify-between border-b border-slate-100 z-0">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-full flex items-center h-0 border-t border-dashed border-slate-200"
                >
                  <span className="absolute -left-1 text-[10px] text-slate-400 bg-white pr-2 -translate-y-1/2">
                    {Math.round(maxLeadCount - (maxLeadCount / 4) * i)}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative z-10 w-full h-full flex items-end justify-around pt-2 pl-10 pb-8">
              {leadStatuses.map((status) => {
                const count = s.leads.byStatus[status] || 0;
                const height =
                  maxLeadCount > 0
                    ? `${Math.max((count / maxLeadCount) * 100, 2)}%`
                    : "2%";
                return (
                  <div
                    key={status}
                    className="flex flex-col items-center w-[14%] h-full justify-end group"
                  >
                    <div className="mb-1 px-1.5 py-0.5 bg-white text-[10px] font-semibold text-slate-700 rounded shadow-sm border border-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </div>
                    <div
                      className="w-full rounded-t-sm hover:brightness-110 transition-all cursor-pointer"
                      style={{
                        height,
                        backgroundColor: LEAD_STATUS_COLORS[status],
                      }}
                    ></div>
                    <span className="text-[10px] text-slate-400 font-medium mt-2 whitespace-nowrap">
                      {LEAD_STATUS_LABELS[status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Deal Pipeline Bar Chart */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-baseline gap-4">
              <h3 className="text-lg font-bold text-slate-900">Deal Pipeline</h3>
              <span className="text-xs text-slate-400">By stage</span>
            </div>
            <button className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 h-48 relative">
            <div className="absolute inset-0 flex flex-col justify-between border-b border-slate-100 z-0">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-full flex items-center h-0 border-t border-dashed border-slate-200"
                >
                  <span className="absolute -left-1 text-[10px] text-slate-400 bg-white pr-2 -translate-y-1/2">
                    {Math.round(maxDealCount - (maxDealCount / 4) * i)}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative z-10 w-full h-full flex items-end justify-around pt-2 pl-10 pb-8">
              {dealStages.map((stage) => {
                const count = s.deals.byStage[stage] || 0;
                const height =
                  maxDealCount > 0
                    ? `${Math.max((count / maxDealCount) * 100, 2)}%`
                    : "2%";
                return (
                  <div
                    key={stage}
                    className="flex flex-col items-center w-[16%] h-full justify-end group"
                  >
                    <div className="mb-1 px-1.5 py-0.5 bg-white text-[10px] font-semibold text-slate-700 rounded shadow-sm border border-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {count}
                    </div>
                    <div
                      className="w-full rounded-t-sm hover:brightness-110 transition-all cursor-pointer"
                      style={{
                        height,
                        backgroundColor: DEAL_STAGE_COLORS[stage],
                      }}
                    ></div>
                    <span className="text-[10px] text-slate-400 font-medium mt-2 whitespace-nowrap">
                      {DEAL_STAGE_LABELS[stage]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════ ROW 3: Team + Projects Overview + Donut ═══════ */}

        {/* Card: Team Members */}
        <div className="col-span-1 bg-white rounded-[24px] p-6 pb-8 border border-slate-100 shadow-sm shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between h-[220px]">
          <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 mb-4 bg-slate-50">
            <UsersRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-slate-900">
                {s.users.total}
              </span>
              <span className="text-lg font-medium text-slate-700">users</span>
            </div>
            <p className="text-sm text-slate-500">
              {s.users.active} users{" "}
              <span className="text-emerald-500">are active</span> in the system.
            </p>
          </div>
        </div>

        {/* Card: Projects Overview */}
        <div className="col-span-1 bg-white rounded-[24px] p-6 pb-8 border border-slate-100 shadow-sm shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent opacity-50 pointer-events-none"></div>

          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 mb-4 bg-slate-50">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-extrabold text-slate-900">
                {s.projects.total}
              </span>
              <span className="text-lg font-medium text-slate-700">projects</span>
            </div>
            <p className="text-sm text-slate-500">
              {s.projects.total} projects{" "}
              <span className="text-indigo-500">{periodSubtitle}</span>.
              {s.projects.change !== null && s.projects.change !== undefined && (
                <span className="ml-1">
                  <ChangeTag value={s.projects.change} />
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Project Status Donut Chart */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col h-[220px]">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-baseline gap-4">
              <h3 className="text-lg font-bold text-slate-900">Projects by Status</h3>
              <span className="text-xs text-slate-400">Distribution</span>
            </div>
            <button className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-1 items-center gap-8 pl-4">
            <div
              className="relative w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: conicGradient }}
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-slate-700">
                  {s.projects.total}
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              {projectSlices.map((sl) => (
                <div
                  key={sl.status}
                  className="flex items-center justify-between text-xs text-slate-600"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sl.color }}
                    ></span>
                    {sl.label}
                  </div>
                  <span className="font-semibold">
                    {sl.count} ({sl.pct}%)
                  </span>
                </div>
              ))}
              {projectSlices.length === 0 && (
                <p className="text-xs text-slate-400">No projects yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ ROW 4: Recent Activity Tables ═══════ */}

        {/* Recent Leads */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Leads</h3>
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </button>
          </div>

          {s.recentLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-3 font-medium text-slate-900">
                        {lead.companyName}
                      </td>
                      <td className="py-3 text-slate-600">
                        {lead.contactName}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="py-3 text-right font-medium text-slate-700" suppressHydrationWarning>
                        {lead.estimatedValue
                          ? format(lead.estimatedValue, { decimals: 0 })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">
              No leads {periodSubtitle}. Start adding leads to see them here.
            </p>
          )}
        </div>

        {/* Recent Deals */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Deals</h3>
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View All →
            </button>
          </div>

          {s.recentDeals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="pb-3 font-medium">Deal</th>
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Stage</th>
                    <th className="pb-3 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-3 font-medium text-slate-900">
                        {deal.title}
                      </td>
                      <td className="py-3 text-slate-600">
                        {deal.lead?.companyName || "—"}
                      </td>
                      <td className="py-3">
                        <StageBadge stage={deal.stage} />
                      </td>
                      <td className="py-3 text-right font-medium text-slate-700" suppressHydrationWarning>
                        {deal.value ? format(deal.value, { decimals: 0 }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">
              No deals {periodSubtitle}. Convert qualified leads to see deals here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Badge Components ─── */

function StatusBadge({ status }) {
  const colors = {
    NEW: "bg-blue-50 text-blue-600",
    CONTACTED: "bg-sky-50 text-sky-600",
    QUALIFIED: "bg-emerald-50 text-emerald-600",
    UNQUALIFIED: "bg-amber-50 text-amber-600",
    CONVERTED: "bg-green-50 text-green-600",
    LOST: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        colors[status] || "bg-slate-50 text-slate-600"
      }`}
    >
      {LEAD_STATUS_LABELS[status] || status}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    LOW: "bg-slate-50 text-slate-500",
    MEDIUM: "bg-blue-50 text-blue-600",
    HIGH: "bg-orange-50 text-orange-600",
    URGENT: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        colors[priority] || "bg-slate-50 text-slate-500"
      }`}
    >
      {priority}
    </span>
  );
}

function StageBadge({ stage }) {
  const colors = {
    DISCOVERY: "bg-indigo-50 text-indigo-600",
    PROPOSAL: "bg-blue-50 text-blue-600",
    NEGOTIATION: "bg-amber-50 text-amber-600",
    WON: "bg-emerald-50 text-emerald-600",
    LOST: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        colors[stage] || "bg-slate-50 text-slate-600"
      }`}
    >
      {DEAL_STAGE_LABELS[stage] || stage}
    </span>
  );
}
