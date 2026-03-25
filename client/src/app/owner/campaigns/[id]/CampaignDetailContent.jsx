"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Megaphone,
  Calendar,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  Users,
  Eye,
  BarChart3,
  Play,
  Pause,
  Archive,
  ExternalLink,
  Target,
  Layers,
  Clock,
  Zap,
} from "lucide-react";

import { updateCampaignStatus, getCampaignDailyInsightsAction } from "@/actions/campaigns.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";

const STATUS_COLORS = {
  ACTIVE: "from-emerald-500 to-green-600",
  PAUSED: "from-amber-500 to-orange-600",
  ARCHIVED: "from-slate-500 to-gray-600",
  DELETED: "from-red-500 to-rose-600",
};

const STATUS_BADGE = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-slate-50 text-slate-500 border-slate-200",
  DELETED: "bg-red-50 text-red-600 border-red-200",
};

function fmt(val) {
  if (!val && val !== 0) return "—";
  return new Intl.NumberFormat("en-IN").format(val);
}

function fmtCurr(val) {
  if (!val && val !== 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

export default function CampaignDetailContent({ initialCampaign }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = (newStatus) => {
    startTransition(async () => {
      const result = await updateCampaignStatus(campaign.id, newStatus);
      if (result.success) {
        setCampaign((c) => ({ ...c, status: newStatus }));
        showToast("success", `Campaign ${newStatus.toLowerCase()} successfully`);
      } else {
        showToast("error", result.error || "Failed to update status");
      }
    });
  };

  const ins = campaign.insights || {};
  const adSets = campaign.adSets || [];
  const gradientClass = STATUS_COLORS[campaign.status] || STATUS_COLORS.ARCHIVED;
  const badgeClass = STATUS_BADGE[campaign.status] || STATUS_BADGE.ARCHIVED;

  const budget = campaign.dailyBudget
    ? `${fmtCurr(campaign.dailyBudget)}/day`
    : campaign.lifetimeBudget
      ? `${fmtCurr(campaign.lifetimeBudget)} lifetime`
      : "No budget set";

  const startDate = campaign.startTime
    ? new Date(campaign.startTime).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Not set";
  const stopDate = campaign.stopTime
    ? new Date(campaign.stopTime).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "Ongoing";

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Campaign Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Campaigns", href: "/owner/campaigns" },
          { label: campaign.name },
        ]}
        actions={
          <a
            href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Ads Manager
          </a>
        }
      />

      {/* ═══ Profile Header ═══ */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className={`h-28 bg-gradient-to-r ${gradientClass} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
              <Megaphone className="w-10 h-10 text-slate-600" />
            </div>

            <div className="flex-1 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">{campaign.name}</h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${badgeClass}`}>
                    {campaign.status}
                  </span>
                  {campaign.objective && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
                      {campaign.objective.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  {budget}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {startDate} → {stopDate}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  ID: {campaign.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Performance Metrics ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={TrendingUp} label="Impressions" value={fmt(ins.impressions)} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <MetricCard icon={MousePointerClick} label="Clicks" value={fmt(ins.clicks)} sub={ins.ctr ? `${parseFloat(ins.ctr).toFixed(2)}% CTR` : null} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <MetricCard icon={DollarSign} label="Total Spend" value={fmtCurr(ins.spend)} sub={ins.cpc ? `${fmtCurr(ins.cpc)} CPC` : null} iconBg="bg-emerald-50" iconColor="text-emerald-600" accent />
        <MetricCard icon={Users} label="Leads" value={fmt(ins.leads)} sub={ins.reach ? `${fmt(ins.reach)} reach` : null} iconBg="bg-purple-50" iconColor="text-purple-600" />
      </div>

      {/* ═══ Additional Metrics ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Eye} label="Reach" value={fmt(ins.reach)} iconBg="bg-sky-50" iconColor="text-sky-600" />
        <MetricCard icon={BarChart3} label="Frequency" value={ins.frequency ? parseFloat(ins.frequency).toFixed(2) : "—"} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <MetricCard icon={Zap} label="CPM" value={fmtCurr(ins.cpm)} iconBg="bg-orange-50" iconColor="text-orange-600" />
        <MetricCard icon={Target} label="Conversions" value={fmt(ins.conversions)} iconBg="bg-rose-50" iconColor="text-rose-600" />
      </div>

      {/* ═══ Ad Sets ═══ */}
      {adSets.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ad Sets</h3>
              <p className="text-xs text-slate-400">{adSets.length} ad set{adSets.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {adSets.map((adSet) => {
              const adSetBadge = STATUS_BADGE[adSet.status] || STATUS_BADGE.ARCHIVED;
              const adSetBudget = adSet.dailyBudget
                ? `${fmtCurr(adSet.dailyBudget)}/day`
                : adSet.lifetimeBudget
                  ? `${fmtCurr(adSet.lifetimeBudget)} lifetime`
                  : "—";

              return (
                <div
                  key={adSet.id}
                  className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{adSet.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${adSetBadge}`}>
                        {adSet.status}
                      </span>
                      {adSet.optimizationGoal && (
                        <span className="text-xs text-slate-400">
                          {adSet.optimizationGoal.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Budget</p>
                      <p className="font-medium text-slate-700">{adSetBudget}</p>
                    </div>
                    {adSet.bidStrategy && (
                      <div className="text-center">
                        <p className="text-xs text-slate-400">Bid Strategy</p>
                        <p className="font-medium text-slate-700 text-xs">{adSet.bidStrategy.replace(/_/g, " ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Status Actions ═══ */}
      <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Campaign Actions</h3>
        <p className="text-sm text-slate-500 mb-6">
          Manage this campaign's status directly from your CRM.
        </p>
        <div className="flex flex-wrap gap-3">
          {campaign.status === "ACTIVE" && (
            <button
              onClick={() => handleStatusChange("PAUSED")}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Pause className="w-4 h-4" />
              Pause Campaign
            </button>
          )}
          {campaign.status === "PAUSED" && (
            <button
              onClick={() => handleStatusChange("ACTIVE")}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Resume Campaign
            </button>
          )}
          {(campaign.status === "ACTIVE" || campaign.status === "PAUSED") && (
            <button
              onClick={() => handleStatusChange("ARCHIVED")}
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />
              Archive Campaign
            </button>
          )}
          <a
            href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${campaign.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Edit in Ads Manager
          </a>
        </div>
      </div>

      {/* ═══ Insights Period Info ═══ */}
      {ins.dateStart && (
        <div className="bg-slate-50 rounded-[24px] p-4 border border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Insights data for period: {new Date(ins.dateStart).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} —{" "}
            {new Date(ins.dateStop).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Metric Card ─── */

function MetricCard({ icon: Icon, label, value, sub, iconBg, iconColor, accent }) {
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
