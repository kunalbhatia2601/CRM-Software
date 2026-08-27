"use client";

import { useState, useEffect, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { Loader2, Check, AlertCircle, Wallet } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getProjectOptions } from "@/actions/projects.action";
import {
  getCampaignTypes, createCampaign, updateCampaign, getProjectAdBudget,
} from "@/actions/campaigns.action";

const OBJECTIVES = [
  { value: "LEAD_GENERATION", label: "Lead generation" },
  { value: "BRAND_AWARENESS", label: "Brand awareness" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "CONVERSIONS", label: "Conversions" },
  { value: "APP_INSTALLS", label: "App installs" },
];

const STATUSES = ["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const EMPTY = {
  name: "", description: "", typeId: "", objective: "LEAD_GENERATION", status: "DRAFT",
  projectId: "", startDate: new Date().toISOString().slice(0, 10), endDate: "",
  budgetAllocated: "", dailyCap: "", overspendThreshold: "", minCplTarget: "",
};

/**
 * Create or edit a campaign.
 *
 * Every campaign belongs to a project, because that is where its ad budget
 * lives. Allocation is capped by what the project has available — shown live
 * here, and enforced again server-side.
 */
export default function CampaignForm({ campaign = null, onSaved, onCancel }) {
  const { format } = useSite();

  const [types, setTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [budget, setBudget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCampaignTypes().then((r) => setTypes(r.success ? r.data : []));
    getProjectOptions().then(setProjects);
  }, []);

  useEffect(() => {
    if (!campaign) return;
    setForm({
      name: campaign.name || "",
      description: campaign.description || "",
      typeId: campaign.typeId || "",
      objective: campaign.objective || "LEAD_GENERATION",
      status: campaign.status || "DRAFT",
      projectId: campaign.projectId || "",
      startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : EMPTY.startDate,
      endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : "",
      budgetAllocated: campaign.budgetAllocated != null ? String(campaign.budgetAllocated) : "",
      dailyCap: campaign.dailyCap != null ? String(campaign.dailyCap) : "",
      overspendThreshold: campaign.overspendThreshold != null ? String(campaign.overspendThreshold) : "",
      minCplTarget: campaign.minCplTarget != null ? String(campaign.minCplTarget) : "",
    });
  }, [campaign]);

  // Show what the project can actually fund for the chosen month.
  useEffect(() => {
    if (!form.projectId || !form.startDate) { setBudget(null); return; }
    const d = new Date(form.startDate);
    getProjectAdBudget(form.projectId, { year: d.getFullYear(), month: d.getMonth() + 1 })
      .then((r) => setBudget(r.success ? r.data : null));
  }, [form.projectId, form.startDate]);

  const type = useMemo(() => types.find((t) => t.id === form.typeId) || null, [types, form.typeId]);

  // Editing a campaign frees up its own allocation.
  const headroom = budget
    ? budget.available + (campaign ? Number(campaign.budgetAllocated) || 0 : 0)
    : null;
  const overBudget =
    headroom !== null && Number(form.budgetAllocated) > headroom;

  const submit = async () => {
    if (!form.name.trim()) return setError("Give the campaign a name.");
    if (!form.typeId) return setError("Pick a campaign type.");
    if (!form.projectId) return setError("Pick the project this campaign runs for.");
    if (!form.startDate) return setError("Set a start date.");
    if (overBudget) return setError("Allocation is more than this project has available.");

    setError(null);
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      typeId: form.typeId,
      objective: form.objective,
      status: form.status,
      projectId: form.projectId,
      startDate: form.startDate,
      endDate: form.endDate || null,
      budgetAllocated: Number(form.budgetAllocated) || 0,
      dailyCap: form.dailyCap === "" ? null : Number(form.dailyCap),
      overspendThreshold: form.overspendThreshold === "" ? null : Number(form.overspendThreshold),
      minCplTarget: form.minCplTarget === "" ? null : Number(form.minCplTarget),
    };
    const res = campaign
      ? await updateCampaign(campaign.id, payload)
      : await createCampaign(payload);
    setSaving(false);
    if (res.success) onSaved?.(res.data);
    else setError(res.error);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Name *</label>
        <input dir="ltr" className={inputClass} placeholder="Diwali lead-gen — Meta"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>

      {/* Type picker — decides which metrics get captured daily */}
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1.5 block">Type *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {types.map((t) => {
            const Icon = LucideIcons[t.icon] || LucideIcons.Megaphone;
            const on = form.typeId === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setForm({ ...form, typeId: t.id })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  on ? "border-[#5542F6] bg-indigo-50/60 dark:bg-indigo-900/20"
                     : "border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
                }`}>
                <Icon className={`w-4 h-4 shrink-0 ${on ? "text-[#5542F6]" : "text-slate-400"}`} />
                <span className="text-xs font-medium text-slate-900 dark:text-slate-50 truncate">{t.name}</span>
              </button>
            );
          })}
        </div>
        {type && (
          <p className="text-[11px] text-slate-400 mt-1.5">
            Captures daily: {(type.metricSchema || []).map((m) => m.label).join(", ")}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Project *</label>
          <select className={inputClass} value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">Select a project…</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">Ad budget is held per project.</p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Objective</label>
          <select className={inputClass} value={form.objective}
            onChange={(e) => setForm({ ...form, objective: e.target.value })}>
            {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Start *</label>
          <input type="date" className={inputClass} value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">End</label>
          <input type="date" className={inputClass} value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
          <select className={inputClass} value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </div>

      {/* Budget, with live headroom */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <Wallet className="w-3.5 h-3.5" /> Budget
        </div>

        {budget && (
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><span className="text-slate-400">Funded</span><p className="font-semibold text-slate-900 dark:text-slate-50">{format(budget.funded, { decimals: 0 })}</p></div>
            <div><span className="text-slate-400">Allocated</span><p className="font-semibold text-slate-900 dark:text-slate-50">{format(budget.allocated, { decimals: 0 })}</p></div>
            <div><span className="text-slate-400">Available</span><p className={`font-semibold ${headroom > 0 ? "text-emerald-600" : "text-slate-900 dark:text-slate-50"}`}>{format(headroom ?? 0, { decimals: 0 })}</p></div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Allocate to this campaign</label>
            <input dir="ltr" type="number" min="0" step="0.01"
              className={`${inputClass} ${overBudget ? "border-red-400 focus:ring-red-400" : ""}`}
              value={form.budgetAllocated}
              onChange={(e) => setForm({ ...form, budgetAllocated: e.target.value })} />
            {overBudget && (
              <p className="text-[11px] text-red-600 mt-1">
                Over available by {format(Number(form.budgetAllocated) - headroom, { decimals: 0 })}. Finance must release more.
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Daily cap</label>
            <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
              value={form.dailyCap} onChange={(e) => setForm({ ...form, dailyCap: e.target.value })} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Overspend alert at (%)</label>
            <input dir="ltr" type="number" min="0" max="100" className={inputClass} placeholder="90"
              value={form.overspendThreshold}
              onChange={(e) => setForm({ ...form, overspendThreshold: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Cost-per-lead ceiling</label>
            <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
              value={form.minCplTarget}
              onChange={(e) => setForm({ ...form, minCplTarget: e.target.value })} />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Notes</label>
        <textarea dir="ltr" rows={2} className={inputClass}
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {campaign ? "Save changes" : "Create campaign"}
        </button>
        {onCancel && (
          <button onClick={onCancel} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
