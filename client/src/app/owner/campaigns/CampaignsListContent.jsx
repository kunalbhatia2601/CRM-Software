"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Eye,
  Megaphone,
  Loader2,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  Users,
  BarChart3,
  Pause,
  Play,
  Archive,
  ExternalLink,
  WifiOff,
  Settings,
} from "lucide-react";

import { getCampaigns, updateCampaignStatus } from "@/actions/campaigns.action";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";

const STATUS_FILTERS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ARCHIVED", label: "Archived" },
];

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7d", label: "Last 7 Days" },
  { value: "last_14d", label: "Last 14 Days" },
  { value: "last_30d", label: "Last 30 Days" },
  { value: "last_90d", label: "Last 90 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
];

const STATUS_COLORS = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-slate-50 text-slate-500 border-slate-200",
  DELETED: "bg-red-50 text-red-600 border-red-200",
};

function formatCurrency(val) {
  if (!val && val !== 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatNumber(val) {
  if (!val && val !== 0) return "0";
  return new Intl.NumberFormat("en-IN").format(val);
}

export default function CampaignsListContent({ initialCampaigns, initialOverview, error }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialCampaigns);
  const [overview, setOverview] = useState(initialOverview);
  const [status, setStatus] = useState("");
  const [datePreset, setDatePreset] = useState("last_30d");
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCampaigns = useCallback(
    (params = {}) => {
      const query = {
        limit: 25,
        datePreset: params.datePreset || datePreset,
        ...(params.status !== undefined ? (params.status ? { status: params.status } : {}) : status ? { status } : {}),
      };

      startTransition(async () => {
        const result = await getCampaigns(query);
        if (result.success) {
          setData(result.data);
        }
      });
    },
    [status, datePreset]
  );

  const handleStatusFilter = (e) => {
    const val = e.target.value;
    setStatus(val);
    fetchCampaigns({ status: val });
  };

  const handleDatePreset = (e) => {
    const val = e.target.value;
    setDatePreset(val);
    fetchCampaigns({ datePreset: val });
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    const result = await updateCampaignStatus(campaignId, newStatus);
    if (result.success) {
      showToast("success", `Campaign ${newStatus.toLowerCase()} successfully`);
      fetchCampaigns();
    } else {
      showToast("error", result.error || "Failed to update status");
    }
  };

  // Not configured state
  if (error && error.includes("not configured")) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <PageHeader
          title="Campaigns"
          description="Manage your Meta (Facebook/Instagram) ad campaigns."
          breadcrumbs={[
            { label: "Dashboard", href: "/owner/dashboard" },
            { label: "Campaigns" },
          ]}
        />
        <div className="bg-white rounded-[24px] p-12 border border-slate-100 shadow-sm shadow-slate-200/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Meta Ads Not Connected</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Configure your Meta API credentials in Owner Settings to start viewing and managing your ad campaigns.
          </p>
          <Link
            href="/owner/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
          >
            <Settings className="w-4 h-4" />
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  const campaigns = data?.campaigns || [];
  const ins = overview?.insights || {};

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Campaigns"
        description="View and manage your Meta (Facebook/Instagram) ad campaigns in real-time."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Campaigns" },
        ]}
        actions={
          <a
            href="https://adsmanager.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            Open Ads Manager
          </a>
        }
      />

      {/* ═══ Overview Stats ═══ */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Impressions"
            value={formatNumber(ins.impressions)}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={MousePointerClick}
            label="Clicks"
            value={formatNumber(ins.clicks)}
            sub={ins.ctr ? `${parseFloat(ins.ctr).toFixed(2)}% CTR` : null}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <StatCard
            icon={DollarSign}
            label="Total Spend"
            value={formatCurrency(ins.spend)}
            sub={ins.cpc ? `${formatCurrency(ins.cpc)} CPC` : null}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            accent
          />
          <StatCard
            icon={Users}
            label="Leads"
            value={formatNumber(ins.leads)}
            sub={ins.reach ? `${formatNumber(ins.reach)} reach` : null}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>
      )}

      {/* ═══ Filters ═══ */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col lg:flex-row gap-4">
          <select
            value={status}
            onChange={handleStatusFilter}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none shadow-sm cursor-pointer min-w-[160px]"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={datePreset}
            onChange={handleDatePreset}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none shadow-sm cursor-pointer min-w-[160px]"
          >
            {DATE_PRESETS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {isPending && (
            <div className="flex items-center gap-2 text-xs text-slate-400 ml-auto">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* ═══ Campaigns List ═══ */}
      <div className="flex flex-col gap-4">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-[24px] p-12 border border-slate-100 shadow-sm shadow-slate-200/50 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Campaigns Found</h3>
            <p className="text-sm text-slate-500">
              {status ? "No campaigns match the selected filter." : "Create campaigns in Meta Ads Manager to see them here."}
            </p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onStatusChange={handleStatusChange}
              onClick={() => router.push(`/owner/campaigns/${campaign.id}`)}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {data?.paging?.cursors?.after && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              startTransition(async () => {
                const result = await getCampaigns({
                  limit: 25,
                  after: data.paging.cursors.after,
                  ...(status ? { status } : {}),
                  datePreset,
                });
                if (result.success) {
                  setData((prev) => ({
                    campaigns: [...(prev?.campaigns || []), ...(result.data?.campaigns || [])],
                    paging: result.data?.paging,
                  }));
                }
              });
            }}
            disabled={isPending}
            className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm"
          >
            {isPending ? "Loading..." : "Load More Campaigns"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Campaign Card Component ─── */

function CampaignCard({ campaign, onStatusChange, onClick }) {
  const statusClass = STATUS_COLORS[campaign.status] || STATUS_COLORS.ARCHIVED;

  const budget = campaign.dailyBudget
    ? `${formatCurrency(campaign.dailyBudget)}/day`
    : campaign.lifetimeBudget
      ? `${formatCurrency(campaign.lifetimeBudget)} lifetime`
      : "No budget set";

  const startDate = campaign.startTime
    ? new Date(campaign.startTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm shadow-slate-200/50 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Left: Name & Meta Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-slate-900 truncate">{campaign.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${statusClass}`}>
                  {campaign.status}
                </span>
                {campaign.objective && (
                  <span className="text-xs text-slate-400 font-medium">
                    {campaign.objective.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Budget & Schedule */}
        <div className="flex items-center gap-6 text-sm shrink-0">
          <div className="text-center">
            <p className="text-xs text-slate-400 mb-0.5">Budget</p>
            <p className="font-semibold text-slate-900 text-sm">{budget}</p>
          </div>
          {startDate && (
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-0.5">Started</p>
              <p className="font-medium text-slate-700 text-sm">{startDate}</p>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {campaign.status === "ACTIVE" && (
            <button
              onClick={() => onStatusChange(campaign.id, "PAUSED")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              title="Pause Campaign"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {campaign.status === "PAUSED" && (
            <button
              onClick={() => onStatusChange(campaign.id, "ACTIVE")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              title="Resume Campaign"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
            <button
              onClick={() => onStatusChange(campaign.id, "ARCHIVED")}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Archive Campaign"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          <Link
            href={`/owner/campaigns/${campaign.id}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="View Details"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card Component ─── */

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, accent }) {
  return (
    <div
      className={`rounded-[24px] p-5 flex flex-col justify-between min-h-[120px] ${
        accent
          ? "bg-[#5542F6] text-white shadow-xl shadow-indigo-500/20"
          : "bg-white border border-slate-100 shadow-sm shadow-slate-200/50"
      }`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-xs font-medium ${accent ? "text-indigo-200" : "text-slate-500"}`}>
          {label}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent ? "bg-white/20" : iconBg}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-white" : iconColor}`} />
        </div>
      </div>
      <div>
        <p className={`text-lg font-bold ${accent ? "text-white" : "text-slate-900"}`} suppressHydrationWarning>
          {value}
        </p>
        {sub && (
          <p className={`text-xs mt-0.5 ${accent ? "text-indigo-200" : "text-slate-400"}`} suppressHydrationWarning>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
