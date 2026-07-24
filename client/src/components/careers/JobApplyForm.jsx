"use client";

import { useState } from "react";
import { Loader2, Upload, CheckCircle2, Paperclip } from "lucide-react";
import { applyToJob } from "@/actions/jobs.action";
import { usePublicUpload } from "@/hooks/usePublicUpload";

function FileField({ field, value, onChange }) {
  const { upload, uploading, progress } = usePublicUpload();
  const [err, setErr] = useState(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    const r = await upload(file);
    if (r?.fileUrl) onChange({ url: r.fileUrl, name: file.name, size: file.size });
    else setErr("Upload failed");
  };

  return (
    <div>
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:border-[#5542F6] text-sm text-slate-600 dark:text-slate-300">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <span>{uploading ? `Uploading ${progress}%` : value?.name || "Choose file"}</span>
        <input type="file" className="hidden" onChange={pick} />
      </label>
      {value?.url && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Paperclip className="w-3 h-3" />{value.name}</p>}
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
    </div>
  );
}

export default function JobApplyForm({ job }) {
  const [base, setBase] = useState({ fullName: "", email: "", phone: "" });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const fields = Array.isArray(job.formFields) ? job.formFields : [];
  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none";

  const setAnswer = (label, v) => setAnswers((p) => ({ ...p, [label]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!base.fullName.trim() || !base.email.trim()) { setError("Name and email are required"); return; }
    // required custom fields
    for (const f of fields) {
      if (f.required) {
        const v = answers[f.label];
        const empty = f.type === "file" ? !v?.url : !String(v ?? "").trim();
        if (empty) { setError(`"${f.label}" is required`); return; }
      }
    }
    setSubmitting(true);
    const res = await applyToJob(job.slug, { ...base, answers });
    setSubmitting(false);
    if (res.success) setDone(true);
    else setError(res.error || "Failed to submit");
  };

  if (done) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Application submitted!</h3>
        <p className="text-sm text-slate-500 mt-1">Thanks for applying. We'll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Apply for this role</h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name *</label>
          <input className={inputClass} value={base.fullName} onChange={(e) => setBase({ ...base, fullName: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Email *</label>
          <input type="email" className={inputClass} value={base.email} onChange={(e) => setBase({ ...base, email: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-slate-500 mb-1 block">Phone</label>
          <input className={inputClass} value={base.phone} onChange={(e) => setBase({ ...base, phone: e.target.value })} />
        </div>
      </div>

      {fields.map((f) => (
        <div key={f.id}>
          <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}{f.required && " *"}</label>
          {f.type === "textarea" ? (
            <textarea className={inputClass} rows={3} placeholder={f.placeholder} value={answers[f.label] || ""} onChange={(e) => setAnswer(f.label, e.target.value)} />
          ) : f.type === "select" ? (
            <select className={inputClass} value={answers[f.label] || ""} onChange={(e) => setAnswer(f.label, e.target.value)}>
              <option value="">Select...</option>
              {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === "file" ? (
            <FileField field={f} value={answers[f.label]} onChange={(v) => setAnswer(f.label, v)} />
          ) : (
            <input type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"} className={inputClass}
              placeholder={f.placeholder} value={answers[f.label] || ""} onChange={(e) => setAnswer(f.label, e.target.value)} />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Application
      </button>
    </form>
  );
}
