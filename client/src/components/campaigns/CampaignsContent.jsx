"use client";

import { useState, useEffect, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import {
  Plus, Loader2, Megaphone, Search, ChevronDown, ChevronUp, Wallet, Target,
  CalendarDays, Trash2, Pencil, TrendingUp,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import { useSite } from "@/context/SiteContext";
import CampaignForm from "./CampaignForm";
import DailyStatEntry from "./DailyStatEntry";
import { getCampaigns, getCampaign, deleteCampaignStat } from "@/actions/campaigns.action";

const TABS = ["ALL", "ACTIVE", "SCHEDULED", "PAUSED", "COMPLETED", "DRAFT"];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

/** Derived metrics carry their own format; render accordingly. */
function formatDerived(value, format, money) {
  if (value === null || value === undefined) return "—";
  if (format === "percent") return `${value.toFixed(2)}%`;
  if (format === "currency") return money(value);
  return value.toFixed(2);
}

export default function CampaignsContent({ basePath = "/marketing" }) {
  const { format } = useSite();
  const money = (n) => format(Number(n) || 0, { decimals: 0 });

  const [data, setData] = useState({ campaigns: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);      // full campaign incl. stats
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [enteringStat, setEnteringStat] = useState(false);
  const [correcting, setCorrecting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (tab !== "ALL") params.status = tab;
    if (search.trim()) params.search = search.trim();
    const res = await getCampaigns(params);
    if (res.success) setData(res.data);
    else setToast({ type: "error", message: res.error });
    setLoading(false);
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openDetail = async (id) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id);
    setDetail(null);
    setEnteringStat(false);
    setCorrecting(null);
    setLoadingDetail(true);
    const res = await getCampaign(id);
    setLoadingDetail(false);
    if (res.success) setDetail(res.data);
    else setToast({ type: "error", message: res.error });
  };

  const afterStatSaved = (updated) => {
    setDetail(updated);
    setEnteringStat(false);
    setCorrecting(null);
    setToast({ type: "success", message: "Results saved" });
    load();
  };

  const removeStat = async (date) => {
    const res = await deleteCampaignStat(detail.id, date.slice(0, 10));
    if (res.success) {
      const refreshed = await getCampaign(detail.id);
      if (refreshed.success) setDetail(refreshed.data);
      setToast({ type: "success", message: "Day removed" });
      load();
    } else setToast({ type: "error", message: res.error });
  };

  // ── Create / edit ──
  if (creating || editing) {
    return (
      <div className="p-6 space-y-6">
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
        <PageHeader
          title={editing ? "Edit campaign" : "New campaign"}
          breadcrumbs={[{ label: "Campaigns", href: `${basePath}/campaigns` }, { label: editing ? "Edit" : "New" }]}
        />
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <CampaignForm
            campaign={editing}
            onCancel={() => { setCreating(false); setEditing(null); }}
            onSaved={() => {
              setCreating(false); setEditing(null);
              setToast({ type: "success", message: "Campaign saved" });
              load();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Campaigns"
        description="Ads and content, with results recorded daily."
        breadcrumbs={[{ label: "Dashboard", href: `${basePath}/dashboard` }, { label: "Campaigns" }]}
        actions={
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        }
      />

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input dir="ltr" className={`${inputClass} pl-9`} placeholder="Search name or reference…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tab === t ? "bg-[#5542F6] text-white border-[#5542F6]"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
              }`}>
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : data.campaigns.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            {tab === "ALL" ? "No campaigns yet." : `No ${tab.toLowerCase()} campaigns.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.campaigns.map((c) => {
            const Icon = LucideIcons[c.type?.icon] || Megaphone;
            const open = expandedId === c.id;
            const pct = c.budgetAllocated > 0 ? Math.min(100, (c.spend / c.budgetAllocated) * 100) : 0;

            return (
              <div key={c.id}
                className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 transition-all ${
                  open ? "border-[#5542F6] shadow-md" : "border-slate-200 dark:border-slate-800 hover:shadow-sm"
                }`}>
                <div role="button" tabIndex={0} onClick={() => openDetail(c.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(c.id); } }}
                  className="flex items-start gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-orange-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{c.name}</h3>
                      <Badge value={c.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono">{c.reference}</span>
                      <span>· {c.type?.name}</span>
                      <span>· {c.project?.name}</span>
                      <span>· {fmtDate(c.startDate)}{c.endDate ? ` → ${fmtDate(c.endDate)}` : ""}</span>
                    </p>

                    {c.budgetAllocated > 0 && (
                      <div className="mt-2 max-w-sm">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>{money(c.spend)} of {money(c.budgetAllocated)}</span>
                          <span>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">{money(c.spend)}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 justify-end mt-0.5">
                      <Target className="w-3 h-3" /> {c.leadCount} lead{c.leadCount === 1 ? "" : "s"}
                    </p>
                    {open ? <ChevronUp className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                          : <ChevronDown className="w-4 h-4 text-slate-400 ml-auto mt-1" />}
                  </div>
                </div>

                {open && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {loadingDetail || !detail ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                    ) : (
                      <div className="space-y-5">
                        {/* Totals + derived */}
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Totals · {detail.summary.days} day{detail.summary.days === 1 ? "" : "s"} recorded
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(detail.type?.metricSchema || []).map((m) => (
                              <div key={m.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                                <p className="text-[11px] text-slate-400">{m.label}</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                                  {(detail.summary.totals[m.id] ?? 0).toLocaleString("en-IN")}
                                </p>
                              </div>
                            ))}
                          </div>

                          {detail.summary.derived.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                              {detail.summary.derived.map((d) => (
                                <div key={d.id} className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/10">
                                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> {d.label}
                                  </p>
                                  <p className="text-sm font-bold text-[#5542F6] tabular-nums">
                                    {formatDerived(d.value, d.format, money)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Daily entry */}
                        {enteringStat || correcting ? (
                          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-900/10">
                            <DailyStatEntry
                              campaign={detail}
                              existing={correcting}
                              onSaved={afterStatSaved}
                              onCancel={() => { setEnteringStat(false); setCorrecting(null); }}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setEnteringStat(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-lg hover:bg-[#4636d4]">
                              <CalendarDays className="w-3.5 h-3.5" /> Record a day
                            </button>
                            <button onClick={() => setEditing(detail)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900">
                              <Pencil className="w-3.5 h-3.5" /> Edit campaign
                            </button>
                          </div>
                        )}

                        {/* Day-by-day */}
                        {detail.dailyStats?.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Daily results</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-400 text-left">
                                    <th className="py-1.5 pr-3 font-medium">Date</th>
                                    {(detail.type?.metricSchema || []).map((m) => (
                                      <th key={m.id} className="py-1.5 px-2 font-medium text-right">{m.label}</th>
                                    ))}
                                    <th className="py-1.5 px-2 font-medium text-right">Spend</th>
                                    <th className="py-1.5 pl-2" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {[...detail.dailyStats].reverse().map((s) => (
                                    <tr key={s.id} className="border-t border-slate-50 dark:border-slate-800">
                                      <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                        {fmtDate(s.date)}
                                      </td>
                                      {(detail.type?.metricSchema || []).map((m) => (
                                        <td key={m.id} className="py-1.5 px-2 text-right tabular-nums text-slate-900 dark:text-slate-50">
                                          {(s.metrics?.[m.id] ?? 0).toLocaleString("en-IN")}
                                        </td>
                                      ))}
                                      <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-50">
                                        {money(s.spend)}
                                      </td>
                                      <td className="py-1.5 pl-2 text-right whitespace-nowrap">
                                        <button onClick={() => setCorrecting(s)} title="Correct"
                                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                                          <Pencil className="w-3 h-3 text-slate-400" />
                                        </button>
                                        <button onClick={() => removeStat(s.date)} title="Remove"
                                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                                          <Trash2 className="w-3 h-3 text-red-400" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
