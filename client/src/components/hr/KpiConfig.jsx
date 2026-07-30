"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Sliders } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { getKpiConfig, updateKpiConfig } from "@/actions/payroll.action";

const WEIGHTS = [
  { key: "weightAttendance", label: "Attendance" },
  { key: "weightCompletion", label: "Task Completion" },
  { key: "weightOnTime", label: "On-Time Delivery" },
  { key: "weightReviewPass", label: "Review Pass Rate" },
  { key: "weightRework", label: "Rework (low redos)" },
];

const ATT_STATUSES = ["PRESENT", "WORK_FROM_HOME", "ON_DUTY", "HALF_DAY_FIRST", "HALF_DAY_SECOND", "ON_LEAVE"];

export default function KpiConfig({ basePath = "/hr" }) {
  const router = useRouter();
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  useEffect(() => {
    (async () => {
      const res = await getKpiConfig();
      if (res.success) setCfg({ ...res.data, bonusSlabs: Array.isArray(res.data.bonusSlabs) ? res.data.bonusSlabs : [], presentStatuses: res.data.presentStatuses || [] });
      setLoading(false);
    })();
  }, []);

  const setW = (k, v) => setCfg((p) => ({ ...p, [k]: v }));
  const wSum = cfg ? WEIGHTS.reduce((a, w) => a + Number(cfg[w.key] || 0), 0) : 0;

  const addSlab = () => setCfg((p) => ({ ...p, bonusSlabs: [...p.bonusSlabs, { minScore: 0, maxScore: 100, bonusAmount: 0 }] }));
  const setSlab = (i, k, v) => setCfg((p) => ({ ...p, bonusSlabs: p.bonusSlabs.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));
  const rmSlab = (i) => setCfg((p) => ({ ...p, bonusSlabs: p.bonusSlabs.filter((_, idx) => idx !== i) }));

  const togglePresent = (s) => setCfg((p) => ({
    ...p,
    presentStatuses: p.presentStatuses.includes(s) ? p.presentStatuses.filter((x) => x !== s) : [...p.presentStatuses, s],
  }));

  const save = async () => {
    setSaving(true);
    const res = await updateKpiConfig({
      weightAttendance: Number(cfg.weightAttendance),
      weightCompletion: Number(cfg.weightCompletion),
      weightOnTime: Number(cfg.weightOnTime),
      weightReviewPass: Number(cfg.weightReviewPass),
      weightRework: Number(cfg.weightRework),
      bonusSlabs: cfg.bonusSlabs.map((s) => ({ minScore: Number(s.minScore), maxScore: Number(s.maxScore), bonusAmount: Number(s.bonusAmount) })),
      presentStatuses: cfg.presentStatuses,
    });
    setSaving(false);
    if (res.success) { setCfg({ ...res.data, bonusSlabs: res.data.bonusSlabs || [], presentStatuses: res.data.presentStatuses || [] }); showToast("success", "Config saved"); }
    else showToast("error", res.error || "Failed");
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const inputClass = "px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

  return (
    <div className="p-6 max-w-3xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <button onClick={() => router.push(`${basePath}/payroll`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Payroll
      </button>
      <PageHeader title="KPI Configuration" description="Tune how performance scores and bonuses are computed." />

      {/* Weights */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-4 h-4 text-[#5542F6]" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Metric Weights</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">Relative weights — normalized automatically. Current sum: <b>{wSum}</b></p>
        <div className="space-y-3">
          {WEIGHTS.map((w) => (
            <div key={w.key} className="flex items-center gap-3">
              <span className="text-sm text-slate-700 dark:text-slate-300 w-40">{w.label}</span>
              <input type="range" min="0" max="50" value={cfg[w.key]} onChange={(e) => setW(w.key, e.target.value)} className="flex-1 accent-[#5542F6]" />
              <input type="number" min="0" value={cfg[w.key]} onChange={(e) => setW(w.key, e.target.value)} className={`${inputClass} w-20 text-right`} />
              <span className="text-xs text-slate-400 w-12 text-right">{wSum ? Math.round(Number(cfg[w.key]) / wSum * 100) : 0}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bonus slabs */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Bonus Slabs</h3>
          <button onClick={addSlab} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Slab
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">KPI score range → fixed bonus amount (₹).</p>
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-400 uppercase px-1">
            <span className="col-span-3">Min score</span><span className="col-span-3">Max score</span><span className="col-span-5">Bonus (₹)</span><span></span>
          </div>
          {cfg.bonusSlabs.map((s, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input type="number" min="0" max="100" className={`${inputClass} col-span-3`} value={s.minScore} onChange={(e) => setSlab(i, "minScore", e.target.value)} />
              <input type="number" min="0" max="100" className={`${inputClass} col-span-3`} value={s.maxScore} onChange={(e) => setSlab(i, "maxScore", e.target.value)} />
              <input type="number" min="0" className={`${inputClass} col-span-5`} value={s.bonusAmount} onChange={(e) => setSlab(i, "bonusAmount", e.target.value)} />
              <button onClick={() => rmSlab(i)} className="col-span-1 p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg justify-self-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {cfg.bonusSlabs.length === 0 && <p className="text-sm text-slate-400 italic">No slabs — bonus will always be 0.</p>}
        </div>
      </div>

      {/* Present statuses */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">Attendance — "present" statuses</h3>
        <p className="text-xs text-slate-400 mb-3">Which statuses count as a full present day in the attendance metric.</p>
        <div className="flex flex-wrap gap-2">
          {ATT_STATUSES.map((s) => {
            const on = cfg.presentStatuses.includes(s);
            return (
              <button key={s} onClick={() => togglePresent(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${on ? "bg-[#5542F6] text-white border-[#5542F6]" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"}`}>
                {s.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Config
      </button>
    </div>
  );
}
