"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, History, CalendarDays, CheckCircle2, ClipboardList, Clock, RotateCcw, Award } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { getPayrollRecord, updatePayrollRecord, getKpiConfig } from "@/actions/payroll.action";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Metric meta — label, weight key, icon, and how to explain the raw numbers.
const METRICS = [
  { key: "attendance", label: "Attendance", weightKey: "weightAttendance", icon: CalendarDays,
    explain: (raw) => `${raw.presentDays} present + ${raw.halfDays} half-day (×0.5) of ${raw.workDays} working days` },
  { key: "completion", label: "Task Completion", weightKey: "weightCompletion", icon: ClipboardList,
    explain: (raw) => `${raw.completed} completed of ${raw.assigned} assigned` },
  { key: "onTime", label: "On-Time Delivery", weightKey: "weightOnTime", icon: Clock,
    explain: (raw) => `${raw.onTimeCompleted} on-time of ${raw.completed} completed` },
  { key: "reviewPass", label: "Review Pass Rate", weightKey: "weightReviewPass", icon: CheckCircle2,
    explain: (raw) => `${raw.reviewed} approved of ${raw.submitted} submitted for review` },
  { key: "rework", label: "Rework (fewer redos = better)", weightKey: "weightRework", icon: RotateCcw,
    explain: (raw) => `${raw.redos} task${raw.redos === 1 ? "" : "s"} sent back for redo` },
];

function scoreColor(s) {
  if (s >= 80) return "text-emerald-600";
  if (s >= 60) return "text-amber-600";
  return "text-red-600";
}

export default function PayslipDetail({ basePath = "/hr", recordId }) {
  const router = useRouter();
  const { format } = useSite();
  const [record, setRecord] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // editable override
  const [bonus, setBonus] = useState(0);
  const [adjustment, setAdjustment] = useState(0);
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");

  const showToast = (type, message) => setToast({ type, message });

  useEffect(() => {
    (async () => {
      const [r, c] = await Promise.all([getPayrollRecord(recordId), getKpiConfig()]);
      if (r.success) {
        setRecord(r.data);
        setBonus(Number(r.data.computedBonus));
        setAdjustment(Number(r.data.manualAdjustment));
        setStatus(r.data.status);
        setNotes(r.data.notes || "");
      }
      if (c.success) setConfig(c.data);
      setLoading(false);
    })();
  }, [recordId]);

  const save = async () => {
    setSaving(true);
    const res = await updatePayrollRecord(recordId, {
      computedBonus: Number(bonus), manualAdjustment: Number(adjustment), status, notes,
    });
    setSaving(false);
    if (res.success) { setRecord(res.data); showToast("success", "Saved"); }
    else showToast("error", res.error || "Failed");
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!record) return <div className="p-6"><p className="text-slate-500">Record not found.</p></div>;

  const u = record.user;
  const bd = record.breakdown || { metrics: {}, raw: {} };
  const raw = bd.raw || {};
  const wSum = config ? ["weightAttendance", "weightCompletion", "weightOnTime", "weightReviewPass", "weightRework"].reduce((a, k) => a + Number(config[k] || 0), 0) : 100;
  const netPreview = Number(record.basePay) + Number(bonus) + Number(adjustment);

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push(`${basePath}/payroll`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Payroll
        </button>
        <button onClick={() => router.push(`${basePath}/employees/${u.id}/payroll`)} className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
          <History className="w-4 h-4" /> Full history
        </button>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {u.avatar ? <img src={u.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              : <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">{u.firstName?.[0]}{u.lastName?.[0]}</div>}
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{u.firstName} {u.lastName}</h1>
              <p className="text-sm text-slate-400">{u.role} · {MONTHS[record.month - 1]} {record.year}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">KPI Score</p>
            <p className={`text-4xl font-bold ${scoreColor(record.kpiScore)}`}>{record.kpiScore}</p>
          </div>
        </div>
      </div>

      {/* KPI breakdown — the "why" */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-[#5542F6]" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">How this score was calculated</h3>
        </div>
        <div className="space-y-3">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const val = bd.metrics?.[m.key] ?? 0;
            const weight = config ? Number(config[m.weightKey] || 0) : 0;
            const contribution = wSum ? Math.round((val * weight / wSum) * 10) / 10 : 0;
            return (
              <div key={m.key} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{m.label}</p>
                    <p className="text-sm"><span className={`font-semibold ${scoreColor(val)}`}>{val}</span><span className="text-slate-400"> / 100</span></p>
                  </div>
                  <p className="text-xs text-slate-400">{m.explain(raw)}</p>
                  {/* bar */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#5542F6]" style={{ width: `${val}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-400 w-32 text-right">weight {weight}% → +{contribution} pts</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-sm">
          <span className="text-slate-500">Weighted total</span>
          <span className={`font-bold ${scoreColor(record.kpiScore)}`}>{record.kpiScore} / 100</span>
        </div>
      </div>

      {/* Raw activity summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Present days", value: raw.presentDays ?? 0 },
          { label: "Half / Leave / Absent", value: `${raw.halfDays ?? 0}/${raw.leaveDays ?? 0}/${raw.absentDays ?? 0}` },
          { label: "Tasks assigned", value: raw.assigned ?? 0 },
          { label: "Completed", value: raw.completed ?? 0 },
          { label: "On-time", value: raw.onTimeCompleted ?? 0 },
          { label: "Submitted for review", value: raw.submitted ?? 0 },
          { label: "Approved / reviewed", value: raw.reviewed ?? 0 },
          { label: "Redos (rework)", value: raw.redos ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">{s.label}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pay + override */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Pay & Override</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-300">
            <span>Base Pay</span><span className="font-medium">{format(record.basePay)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Performance Bonus <span className="text-xs text-slate-400">(from KPI slab, editable)</span></span>
            <input type="number" min="0" className={`${inputClass} w-40 text-right`} value={bonus} onChange={(e) => setBonus(e.target.value)} />
          </div>
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Manual Adjustment <span className="text-xs text-slate-400">(+/−: incentives, deductions)</span></span>
            <input type="number" className={`${inputClass} w-40 text-right`} value={adjustment} onChange={(e) => setAdjustment(e.target.value)} />
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 font-bold text-slate-900 dark:text-slate-50 text-base">
            <span>Net Pay</span><span>{format(netPreview)}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="FINALIZED">Finalized</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Notes</label>
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes" />
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>
    </div>
  );
}
