"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, AlertCircle, CalendarDays } from "lucide-react";
import { upsertCampaignStat } from "@/actions/campaigns.action";

// Mirrors BACKDATE_DAYS in campaign.validation.js.
const BACKDATE_DAYS = 30;

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const iso = (d) => d.toISOString().slice(0, 10);

/**
 * Record one day's results for a campaign.
 *
 * Fields come from the campaign type's metricSchema, so a Meta campaign asks
 * for impressions and clicks while a Reel asks for plays and saves — without
 * either being hardcoded here.
 *
 * @param {object}   campaign  needs `type.metricSchema` and `startDate`
 * @param {object}   existing  a stat row being corrected, if any
 * @param {Function} onSaved   called with the refreshed campaign
 */
export default function DailyStatEntry({ campaign, existing = null, onSaved, onCancel }) {
  const schema = Array.isArray(campaign?.type?.metricSchema) ? campaign.type.metricSchema : [];

  const today = new Date();
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() - BACKDATE_DAYS);
  // Never before the campaign started — the server rejects it anyway.
  const campaignStart = campaign?.startDate ? campaign.startDate.slice(0, 10) : null;
  const minDate = campaignStart && campaignStart > iso(earliest) ? campaignStart : iso(earliest);

  const [date, setDate] = useState(existing?.date?.slice(0, 10) || iso(today));
  const [metrics, setMetrics] = useState({});
  const [spend, setSpend] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!existing) return;
    setDate(existing.date.slice(0, 10));
    setMetrics(existing.metrics || {});
    setSpend(existing.spend != null ? String(existing.spend) : "");
    setNote(existing.note || "");
  }, [existing]);

  const submit = async () => {
    const missing = schema.filter((f) => f.required && !String(metrics[f.id] ?? "").trim());
    if (missing.length) {
      setError(`Missing: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setError(null);
    setSaving(true);
    const res = await upsertCampaignStat(campaign.id, {
      date,
      metrics,
      spend: Number(spend) || 0,
      note: note.trim() || null,
    });
    setSaving(false);
    if (res.success) onSaved?.(res.data);
    else setError(res.error);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
        <CalendarDays className="w-4 h-4 text-[#5542F6]" />
        {existing ? "Correct results" : "Record a day"}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Date *</label>
          <input
            type="date" className={inputClass} value={date} min={minDate} max={iso(today)}
            onChange={(e) => setDate(e.target.value)}
            disabled={!!existing}
          />
          {!existing && (
            <p className="text-[11px] text-slate-400 mt-1">Up to {BACKDATE_DAYS} days back.</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Spend</label>
          <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
            value={spend} onChange={(e) => setSpend(e.target.value)} />
        </div>
      </div>

      {/* Metrics defined by the campaign type */}
      <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        {schema.map((f) => (
          <div key={f.id}>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              {f.label}
              {f.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              dir="ltr" type="number" min="0" step="any" className={inputClass}
              value={metrics[f.id] ?? ""}
              onChange={(e) => setMetrics({ ...metrics, [f.id]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Note</label>
        <input dir="ltr" className={inputClass} placeholder="Anything unusual about this day"
          value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button onClick={submit} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
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
