"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import * as LucideIcons from "lucide-react";
import { X, Upload, Paperclip, Loader2, Check, Send, AlertCircle } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { useSite } from "@/context/SiteContext";
import Toast from "@/components/ui/Toast";
import { getExpenseCategories, createExpense, updateExpense } from "@/actions/expenses.action";
import { getProjectOptions } from "@/actions/projects.action";

// Mirrors expense.validation.js — the server rejects anything past these.
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ACCEPT = "image/*,application/pdf";

const EMPTY = {
  title: "", description: "", categoryId: "", formData: {}, attachments: [],
  amount: "", taxAmount: "", expenseDate: new Date().toISOString().slice(0, 10),
  paymentMode: "", projectId: "", clientId: "", isBillable: false,
};

const PAYMENT_MODES = [
  { value: "", label: "Not specified" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "COMPANY_CARD", label: "Company card" },
  { value: "OTHER", label: "Other" },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const prettyBytes = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

/** One field from the category's schema. */
function DynamicField({ field, value, onChange }) {
  const common = {
    className: inputClass,
    value: value ?? "",
    onChange: (e) => onChange(field.id, e.target.value),
    placeholder: field.placeholder || "",
  };

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea {...common} rows={3} dir="ltr" />
      ) : field.type === "select" ? (
        <select {...common}>
          <option value="">Select…</option>
          {(field.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : field.type === "date" ? (
        <input {...common} type="date" />
      ) : field.type === "number" ? (
        <input {...common} type="number" step="any" dir="ltr" />
      ) : (
        <input {...common} type="text" dir="ltr" />
      )}

      {field.computed?.rate > 0 && (
        <p className="text-[11px] text-slate-400 mt-1">
          Auto-calculates the amount at {field.computed.rate} per unit. You can still override it.
        </p>
      )}
    </div>
  );
}

/**
 * Record or claim an expense.
 *
 * The form body is driven by the chosen category's `fieldSchema`, so adding a
 * new expense type is a data change, not a code change.
 *
 * @param {object}   expense   existing record when editing
 * @param {Array}    projects  optional, for cost attribution
 * @param {Function} onSaved   called with the saved expense
 * @param {Function} onCancel
 * @param {boolean}  selfApproving  true for OWNER/ADMIN — changes the button wording
 */
export default function ExpenseForm({ expense = null, onSaved, onCancel, selfApproving = false }) {
  const { upload, uploading, progress } = useUpload();
  const { format } = useSite();
  const fileRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getExpenseCategories().then((res) => {
      setCategories(res.success ? res.data : []);
      setLoadingCats(false);
    });
    // Server scopes this: employees see their team's projects, managers see all.
    getProjectOptions().then(setProjects);
  }, []);

  // Editing: hydrate once.
  useEffect(() => {
    if (!expense) return;
    setForm({
      title: expense.title || "",
      description: expense.description || "",
      categoryId: expense.categoryId || "",
      formData: expense.formData || {},
      attachments: Array.isArray(expense.attachments) ? expense.attachments : [],
      amount: expense.amount != null ? String(expense.amount) : "",
      taxAmount: expense.taxAmount ? String(expense.taxAmount) : "",
      expenseDate: expense.expenseDate ? expense.expenseDate.slice(0, 10) : EMPTY.expenseDate,
      paymentMode: expense.paymentMode || "",
      projectId: expense.projectId || "",
      clientId: expense.clientId || "",
      isBillable: !!expense.isBillable,
    });
  }, [expense]);

  const category = useMemo(
    () => categories.find((c) => c.id === form.categoryId) || null,
    [categories, form.categoryId]
  );
  const fields = Array.isArray(category?.fieldSchema) ? category.fieldSchema : [];

  const total = (Number(form.amount) || 0) + (Number(form.taxAmount) || 0);

  const setField = (id, value) => {
    setForm((p) => {
      const formData = { ...p.formData, [id]: value };
      const def = fields.find((f) => f.id === id);
      // A computed field drives the amount unless the user has typed their own.
      if (def?.computed?.rate > 0 && def.computed.into === "amount") {
        const derived = (Number(value) || 0) * def.computed.rate;
        return { ...p, formData, amount: derived ? String(derived) : p.amount };
      }
      return { ...p, formData };
    });
  };

  const onFiles = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;

    const room = MAX_FILES - form.attachments.length;
    if (room <= 0) {
      setError(`You can attach at most ${MAX_FILES} files.`);
      return;
    }

    const rejected = [];
    const accepted = [];
    for (const file of picked.slice(0, room)) {
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name} is ${prettyBytes(file.size)} — limit is 5 MB`);
        continue;
      }
      accepted.push(file);
    }
    if (picked.length > room) {
      rejected.push(`Only ${room} more file${room === 1 ? "" : "s"} can be attached`);
    }
    setError(rejected.length ? rejected.join(". ") : null);

    for (const file of accepted) {
      const r = await upload(file);
      if (r?.fileUrl) {
        setForm((p) => ({
          ...p,
          attachments: [
            ...p.attachments,
            { name: file.name, url: r.fileUrl, key: r.key, mimeType: file.type, size: file.size },
          ],
        }));
      } else {
        setError(`Upload failed for ${file.name}.`);
      }
    }
  };

  const validate = () => {
    if (!form.title.trim()) return "Give this expense a title.";
    if (!form.categoryId) return "Pick a category.";
    if (!form.expenseDate) return "When was this spent?";
    if (!(Number(form.amount) > 0)) return "Amount must be more than zero.";
    const missing = fields.filter((f) => f.required && !String(form.formData?.[f.id] ?? "").trim());
    if (missing.length) return `Missing: ${missing.map((f) => f.label).join(", ")}`;
    if (category?.requiresReceipt && form.attachments.length === 0) {
      return `${category.name} claims need at least one receipt.`;
    }
    return null;
  };

  const submit = async (asDraft) => {
    if (!asDraft) {
      const problem = validate();
      if (problem) { setError(problem); return; }
    }
    setError(null);
    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      categoryId: form.categoryId,
      formData: form.formData,
      attachments: form.attachments,
      amount: Number(form.amount) || 0,
      taxAmount: Number(form.taxAmount) || 0,
      expenseDate: form.expenseDate,
      paymentMode: form.paymentMode || null,
      projectId: form.projectId || null,
      isBillable: form.isBillable,
      status: asDraft ? "DRAFT" : "PENDING",
    };

    const res = expense
      ? await updateExpense(expense.id, payload)
      : await createExpense(payload);
    setSaving(false);

    if (res.success) onSaved?.(res.data);
    else setError(res.error || "Could not save this expense.");
  };

  // ── Category picker ──
  if (!form.categoryId) {
    return (
      <div className="space-y-4">
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">What kind of expense?</h3>
          <p className="text-xs text-slate-400 mt-0.5">The form adapts to what you pick.</p>
        </div>

        {loadingCats ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading categories…
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((c) => {
              const Icon = LucideIcons[c.icon] || LucideIcons.Receipt;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, categoryId: c.id, formData: {} }))}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#5542F6] hover:shadow-sm transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-[#5542F6]" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{c.name}</span>
                  {c.description && <span className="text-[11px] text-slate-400 line-clamp-2">{c.description}</span>}
                </button>
              );
            })}
          </div>
        )}

        {onCancel && (
          <button onClick={onCancel} className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Cancel
          </button>
        )}
      </div>
    );
  }

  const CatIcon = LucideIcons[category?.icon] || LucideIcons.Receipt;

  return (
    <div className="space-y-4">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
          <CatIcon className="w-4.5 h-4.5 text-[#5542F6]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{category?.name}</p>
          {!expense && (
            <button
              onClick={() => setForm((p) => ({ ...p, categoryId: "", formData: {} }))}
              className="text-[11px] text-indigo-600 hover:underline"
            >
              Change category
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">
          Title<span className="text-red-500 ml-0.5">*</span>
        </label>
        <input
          dir="ltr"
          className={inputClass}
          placeholder="Cab to client shoot"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      {/* Category-specific fields */}
      {fields.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          {fields.map((f) => (
            <div key={f.id} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
              <DynamicField field={f} value={form.formData?.[f.id]} onChange={setField} />
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Amount<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            dir="ltr" type="number" min="0" step="0.01" className={inputClass}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Tax</label>
          <input
            dir="ltr" type="number" min="0" step="0.01" className={inputClass}
            value={form.taxAmount}
            onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Date spent<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="date" className={inputClass}
            value={form.expenseDate}
            onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
          />
        </div>
      </div>

      {total > 0 && (
        <p className="text-sm text-slate-500">
          Total <span className="font-bold text-slate-900 dark:text-slate-50">{format(total, { decimals: 2 })}</span>
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Paid by</label>
          <select
            className={inputClass}
            value={form.paymentMode}
            onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
          >
            {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Project (optional)</label>
          {projects.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No projects available to attribute this to.
            </p>
          ) : (
            <select
              className={inputClass}
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value, isBillable: e.target.value ? form.isBillable : false })}
            >
              <option value="">Not project-related</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {form.projectId && (
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox" className="accent-[#5542F6]"
            checked={form.isBillable}
            onChange={(e) => setForm({ ...form, isBillable: e.target.checked })}
          />
          Rechargeable to the client
        </label>
      )}

      {/* Receipts */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-slate-500">
            Receipts
            {category?.requiresReceipt && <span className="text-red-500 ml-0.5">*</span>}
            <span className="ml-2 text-slate-400 font-normal">
              {form.attachments.length} / {MAX_FILES} · 5 MB each
            </span>
          </label>
          <>
            <input
              ref={fileRef} type="file" multiple accept={ACCEPT}
              className="hidden" onChange={onFiles}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading || form.attachments.length >= MAX_FILES}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? `${progress}%` : "Upload"}
            </button>
          </>
        </div>

        {form.attachments.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No receipts attached. Images or PDFs.</p>
        ) : (
          <div className="space-y-1">
            {form.attachments.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                <Paperclip className="w-3 h-3 text-slate-400 shrink-0" />
                <a href={f.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-indigo-600 hover:underline">
                  {f.name}
                </a>
                {f.size ? <span className="text-slate-400 shrink-0">{prettyBytes(f.size)}</span> : null}
                <button onClick={() => setForm({ ...form, attachments: form.attachments.filter((_, j) => j !== i) })}>
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Notes</label>
        <textarea
          dir="ltr" rows={2} className={inputClass}
          placeholder="Anything the approver should know"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => submit(false)}
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : selfApproving ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          {selfApproving ? "Record expense" : "Submit claim"}
        </button>
        <button
          onClick={() => submit(true)}
          disabled={saving || uploading}
          className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          Save draft
        </button>
        {onCancel && (
          <button onClick={onCancel} disabled={saving} className="ml-auto text-sm font-semibold text-slate-500 hover:text-slate-700">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
