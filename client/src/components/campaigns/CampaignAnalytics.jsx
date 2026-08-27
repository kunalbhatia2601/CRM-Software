"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import * as LucideIcons from "lucide-react";
import {
  Loader2, TrendingUp, TrendingDown, Target, Wallet, Megaphone, Filter,
  AlertTriangle, CalendarDays, Activity,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { useSite } from "@/context/SiteContext";
import { getCampaignAnalytics, getProjectCampaignAnalytics } from "@/actions/campaigns.action";

const RANGES = [
  { id: 7, label: "7d" },
  { id: 30, label: "30d" },
  { id: 90, label: "90d" },
  { id: 365, label: "1y" },
];

// One palette so every chart in the screen agrees on colour meaning.
const C = {
  spend: "#5542F6",
  leads: "#10b981",
  secondary: "#f59e0b",
  muted: "#94a3b8",
  danger: "#ef4444",
};
const PIE_COLORS = ["#5542F6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899", "#64748b"];

const iso = (d) => d.toISOString().slice(0, 10);
const shortDate = (s) =>
  new Date(`${s}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Recharts tooltips inherit nothing, so theme them explicitly. */
const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid rgb(226 232 240)",
    fontSize: "12px",
    boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
};

function Stat({ icon: Icon, label, value, sub, tone = "slate" }) {
  const tones = {
    slate: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    red: "text-red-600 bg-red-50 dark:bg-red-900/20",
  };
  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${tones[tone]}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-50 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function Panel({ title, icon: Icon, children, right }) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-[#5542F6]" />} {title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

/**
 * Campaign analysis — agency-wide, or narrowed to one project.
 *
 * @param {string} projectId  when set, only that project's campaigns
 * @param {boolean} compact   fewer panels, for embedding in a dashboard
 */
export default function CampaignAnalytics({ projectId = null, compact = false }) {
  const { format } = useSite();
  const money = (n) => format(Number(n) || 0, { decimals: 0 });

  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metricKey, setMetricKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86400000);
    const params = { from: iso(from), to: iso(to) };
    const res = projectId
      ? await getProjectCampaignAnalytics(projectId, params)
      : await getCampaignAnalytics(params);
    if (res.success) setData(res.data);
    setLoading(false);
  }, [days, projectId]);

  useEffect(() => { load(); }, [load]);

  // Default the secondary series to whichever metric carries the most volume.
  useEffect(() => {
    if (data?.metricKeys?.length && !metricKey) setMetricKey(data.metricKeys[0].id);
  }, [data, metricKey]);

  const series = useMemo(
    () => (data?.series || []).map((d) => ({ ...d, label: shortDate(d.date) })),
    [data]
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data || data.empty) {
    return (
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
        <p className="text-slate-500 dark:text-slate-400">No campaign results in this period.</p>
        <p className="text-xs text-slate-400 mt-1">Record daily results on a campaign to see analysis here.</p>
      </div>
    );
  }

  const t = data.totals;
  const funnelMax = Math.max(1, ...(data.funnel || []).map((f) => f.value));

  return (
    <div className="space-y-5">
      {/* Range */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-400">
          {shortDate(iso(new Date(data.range.from)))} → {shortDate(iso(new Date(data.range.to)))}
          {" · "}{data.campaigns.length} campaign{data.campaigns.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setDays(r.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                days === r.id ? "bg-[#5542F6] text-white border-[#5542F6]"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headline */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat icon={Wallet} tone="indigo" label="Spend" value={money(t.spend)} />
        <Stat icon={Target} tone="emerald" label="Leads" value={t.leads}
          sub={t.cpl !== null ? `${money(t.cpl)} per lead` : "no leads yet"} />
        <Stat icon={TrendingUp} tone="slate" label="Won deals" value={t.won}
          sub={t.costPerWon !== null ? `${money(t.costPerWon)} per win` : "none yet"} />
        <Stat icon={Wallet} tone="emerald" label="Revenue" value={money(t.revenue)} />
        <Stat
          icon={t.roi !== null && t.roi < 0 ? TrendingDown : TrendingUp}
          tone={t.roi === null ? "slate" : t.roi >= 0 ? "emerald" : "red"}
          label="ROI"
          value={t.roi === null ? "—" : `${t.roi.toFixed(0)}%`}
          sub={t.roas !== null ? `${t.roas.toFixed(2)}x return` : null}
        />
      </div>

      {/* Spend vs leads over time */}
      <Panel title="Spend and leads over time" icon={Activity}>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.spend} stopOpacity={0.35} />
                <stop offset="95%" stopColor={C.spend} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => (n === "Spend" ? money(v) : v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area yAxisId="l" type="monotone" dataKey="spend" name="Spend" stroke={C.spend} fill="url(#gSpend)" strokeWidth={2} />
            <Line yAxisId="r" type="monotone" dataKey="leads" name="Leads" stroke={C.leads} strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      {/* Platform metric trend + funnel */}
      <div className={`grid gap-5 ${compact ? "" : "lg:grid-cols-2"}`}>
        <Panel
          title="Platform metric"
          icon={Activity}
          right={
            data.metricKeys.length > 0 && (
              <select
                value={metricKey || ""}
                onChange={(e) => setMetricKey(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none"
              >
                {data.metricKeys.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            )
          }
        >
          {metricKey ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey={metricKey}
                  name={data.metricKeys.find((m) => m.id === metricKey)?.label || metricKey}
                  stroke={C.secondary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-400 italic py-8 text-center">No platform metrics recorded.</p>
          )}
        </Panel>

        <Panel title="Funnel" icon={Filter}>
          <div className="space-y-2.5">
            {(data.funnel || []).map((step, i) => {
              const prev = data.funnel[i - 1];
              const rate = prev && prev.value > 0 ? (step.value / prev.value) * 100 : null;
              return (
                <div key={step.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-300">{step.label}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                      {step.value.toLocaleString("en-IN")}
                      {rate !== null && (
                        <span className="ml-2 text-[11px] font-normal text-slate-400">{rate.toFixed(1)}%</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${(step.value / funnelMax) * 100}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Percentages are conversion from the step above.
          </p>
        </Panel>
      </div>

      {!compact && (
        <>
          {/* Efficiency + pacing */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Panel title="Cost per lead by week" icon={TrendingUp}>
              {data.weekly.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.weekly.map((w) => ({ ...w, label: shortDate(w.week) }))}
                    margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => (n === "Leads" ? v : money(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="l" dataKey="spend" name="Spend" fill={C.spend} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="r" type="monotone" dataKey="cpl" name="Cost per lead" stroke={C.danger} strokeWidth={2} dot />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 italic py-8 text-center">Not enough data yet.</p>
              )}
              <p className="text-[11px] text-slate-400 mt-2">
                A rising line as bars grow means efficiency is dropping as you scale.
              </p>
            </Panel>

            <Panel title="Budget pacing" icon={Wallet}>
              {data.pacing ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">
                        {money(data.pacing.spent)} of {money(data.pacing.allocated)}
                      </span>
                      <span className={`font-semibold ${data.pacing.usedPct >= 90 ? "text-red-600" : "text-slate-900 dark:text-slate-50"}`}>
                        {data.pacing.usedPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${
                        data.pacing.usedPct >= 90 ? "bg-red-500" : data.pacing.usedPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`} style={{ width: `${Math.min(100, data.pacing.usedPct)}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <p className="text-slate-400">Daily rate</p>
                      <p className="font-bold text-slate-900 dark:text-slate-50">{money(data.pacing.dailyRate)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                      <p className="text-slate-400">Remaining</p>
                      <p className="font-bold text-slate-900 dark:text-slate-50">{money(data.pacing.remaining)}</p>
                    </div>
                    {data.pacing.daysRemaining !== null && (
                      <>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                          <p className="text-slate-400">Days left</p>
                          <p className="font-bold text-slate-900 dark:text-slate-50">{data.pacing.daysRemaining}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${
                          data.pacing.projected > data.pacing.allocated
                            ? "bg-red-50 dark:bg-red-900/20" : "bg-emerald-50/60 dark:bg-emerald-900/10"
                        }`}>
                          <p className="text-slate-400">Projected</p>
                          <p className={`font-bold ${
                            data.pacing.projected > data.pacing.allocated
                              ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"
                          }`}>
                            {money(data.pacing.projected)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {data.pacing.projected > data.pacing.allocated && (
                    <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      At this rate spend will exceed the allocation by{" "}
                      {money(data.pacing.projected - data.pacing.allocated)}.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-8 text-center">No budget allocated yet.</p>
              )}
            </Panel>
          </div>

          {/* Platform split + day of week */}
          <div className="grid lg:grid-cols-2 gap-5">
            <Panel title="Spend by platform" icon={Megaphone}>
              {data.platforms.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={data.platforms} dataKey="spend" nameKey="platform"
                        innerRadius={45} outerRadius={78} paddingAngle={2}>
                        {data.platforms.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v) => money(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {data.platforms.map((p, i) => (
                      <div key={p.platform} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600 dark:text-slate-300 flex-1 truncate">
                          {p.platform.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50 tabular-nums">{money(p.spend)}</span>
                        <span className="text-slate-400 w-14 text-right">{p.leads} lead{p.leads === 1 ? "" : "s"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic py-8 text-center">Nothing to split yet.</p>
              )}
            </Panel>

            <Panel title="Average by day of week" icon={CalendarDays}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.dayOfWeek} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => (n === "Avg spend" ? money(v) : Number(v).toFixed(1))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avgSpend" name="Avg spend" fill={C.spend} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgLeads" name="Avg leads" fill={C.leads} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </>
      )}

      {/* Campaign comparison */}
      <Panel title="Campaign comparison" icon={Megaphone}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 pr-3 font-medium">Campaign</th>
                {!projectId && <th className="py-2 px-2 font-medium">Project</th>}
                <th className="py-2 px-2 font-medium text-right">Spend</th>
                <th className="py-2 px-2 font-medium text-right">Leads</th>
                <th className="py-2 px-2 font-medium text-right">CPL</th>
                <th className="py-2 px-2 font-medium text-right">Won</th>
                <th className="py-2 px-2 font-medium text-right">Revenue</th>
                <th className="py-2 pl-2 font-medium text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => {
                const Icon = LucideIcons[c.type?.icon] || Megaphone;
                return (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-50 truncate">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.type?.name}</p>
                        </div>
                        <Badge value={c.status} />
                      </div>
                    </td>
                    {!projectId && (
                      <td className="py-2 px-2 text-slate-500 truncate max-w-[10rem]">{c.project?.name}</td>
                    )}
                    <td className="py-2 px-2 text-right tabular-nums text-slate-900 dark:text-slate-50">{money(c.spend)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-900 dark:text-slate-50">{c.leads}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-500">{c.cpl === null ? "—" : money(c.cpl)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-900 dark:text-slate-50">{c.won}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-slate-900 dark:text-slate-50">{money(c.revenue)}</td>
                    <td className={`py-2 pl-2 text-right tabular-nums font-semibold ${
                      c.roi === null ? "text-slate-400" : c.roi >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}>
                      {c.roi === null ? "—" : `${c.roi.toFixed(0)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
