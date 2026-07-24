"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Save, ChevronUp, ChevronDown } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { getJob, createJob, updateJob } from "@/actions/jobs.action";

const TYPES = ["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT", "FREELANCE"];
const WORK_MODES = ["ON_SITE", "REMOTE", "HYBRID"];
const STATUSES = ["DRAFT", "OPEN", "CLOSED", "ARCHIVED"];
const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Paragraph" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "file", label: "File upload" },
];

let fieldSeq = 0;
const newFieldId = () => `f_${Date.now()}_${fieldSeq++}`;

export default function JobEditor({ basePath = "/hr", jobId = null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(!!jobId);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    title: "", department: "", location: "", type: "FULL_TIME", workMode: "ON_SITE",
    salaryRange: "", status: "DRAFT", description: "",
  });
  const [fields, setFields] = useState([]);

  const showToast = (type, message) => setToast({ type, message });

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      const res = await getJob(jobId);
      if (res.success) {
        const j = res.data;
        setForm({
          title: j.title || "", department: j.department || "", location: j.location || "",
          type: j.type || "FULL_TIME", workMode: j.workMode || "ON_SITE",
          salaryRange: j.salaryRange || "", status: j.status || "DRAFT", description: j.description || "",
        });
        setFields(Array.isArray(j.formFields) ? j.formFields : []);
      }
      setLoading(false);
    })();
  }, [jobId]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // ── form builder ops ──
  const addField = () => setFields((p) => [...p, { id: newFieldId(), label: "", type: "text", required: false }]);
  const updateField = (i, patch) => setFields((p) => p.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const removeField = (i) => setFields((p) => p.filter((_, idx) => idx !== i));
  const moveField = (i, dir) => setFields((p) => {
    const j = i + dir;
    if (j < 0 || j >= p.length) return p;
    const next = [...p];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const handleSave = () => {
    if (!form.title.trim()) { showToast("error", "Title required"); return; }
    if (!form.description.trim()) { showToast("error", "Description required"); return; }
    // sanitize fields
    const cleanFields = fields
      .filter((f) => f.label.trim())
      .map((f) => ({
        id: f.id, label: f.label.trim(), type: f.type, required: !!f.required,
        ...(f.type === "select" ? { options: (f.options || []).filter((o) => o?.trim()) } : {}),
        ...(f.placeholder ? { placeholder: f.placeholder } : {}),
      }));

    const payload = { ...form, formFields: cleanFields };
    startTransition(async () => {
      const res = jobId ? await updateJob(jobId, payload) : await createJob(payload);
      if (res.success) router.push(`${basePath}/jobs`);
      else showToast("error", res.error || "Failed to save");
    });
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none";
  const labelClass = "text-xs font-medium text-slate-500 mb-1 block";

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <button onClick={() => router.push(`${basePath}/jobs`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Jobs
      </button>
      <PageHeader title={jobId ? "Edit Job" : "New Job"} />

      {/* Job details */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6 space-y-4">
        <div>
          <label className={labelClass}>Title *</label>
          <input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Senior Video Editor" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={labelClass}>Department</label><input className={inputClass} value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="Creative" /></div>
          <div><label className={labelClass}>Location</label><input className={inputClass} value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Kurukshetra, India" /></div>
          <div>
            <label className={labelClass}>Type</label>
            <select className={inputClass} value={form.type} onChange={(e) => update("type", e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Work Mode</label>
            <select className={inputClass} value={form.workMode} onChange={(e) => update("workMode", e.target.value)}>
              {WORK_MODES.map((w) => <option key={w} value={w}>{w.replace("_", " ")}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>Salary Range</label><input className={inputClass} value={form.salaryRange} onChange={(e) => update("salaryRange", e.target.value)} placeholder="₹30k–50k / month" /></div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Description *</label>
          <textarea className={inputClass} rows={6} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Role, responsibilities, requirements..." />
        </div>
      </div>

      {/* Custom application form builder */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Application Form</h3>
          <button onClick={addField} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Field
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-4">Name, email and phone are always collected. Add custom questions below.</p>

        {fields.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No custom fields. Applicants will just provide name, email, phone.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col pt-1 text-slate-300">
                    <button onClick={() => moveField(i, -1)} className="hover:text-slate-500"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => moveField(i, 1)} className="hover:text-slate-500"><ChevronDown className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex-1 grid sm:grid-cols-2 gap-2">
                    <input className={inputClass} placeholder="Question label" value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} />
                    <select className={inputClass} value={f.type} onChange={(e) => updateField(i, { type: e.target.value })}>
                      {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    {f.type === "select" && (
                      <input className={`${inputClass} sm:col-span-2`} placeholder="Options, comma-separated"
                        value={(f.options || []).join(", ")}
                        onChange={(e) => updateField(i, { options: e.target.value.split(",").map((o) => o.trim()) })} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                      <input type="checkbox" checked={!!f.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="accent-[#5542F6]" /> Req
                    </label>
                    <button onClick={() => removeField(i)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Job
      </button>
    </div>
  );
}
