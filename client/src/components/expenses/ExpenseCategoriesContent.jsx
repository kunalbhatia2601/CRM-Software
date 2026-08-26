"use client";

import { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import {
  Plus, Loader2, Trash2, Pencil, X, Check, GripVertical, Receipt, EyeOff,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  getExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
} from "@/actions/expenses.action";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "date", label: "Date" },
];

// A curated shortlist keeps the picker usable; any lucide name still works.
const ICONS = [
  "Receipt", "Plane", "Fuel", "UtensilsCrossed", "BedDouble", "AppWindow",
  "HardDrive", "Users", "Car", "Train", "ShoppingBag", "Wrench", "Gift", "Phone",
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const EMPTY = {
  name: "", description: "", icon: "Receipt", fieldSchema: [],
  requiresReceipt: true, isReimbursable: true, isActive: true, sortOrder: 0,
};

/** Turns a label into a stable field id: "Distance (km)" → "distance_km". */
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60) || "field";

/** Editor for one field in the claim form. */
function FieldRow({ field, onChange, onRemove }) {
  const set = (k, v) => onChange({ ...field, [k]: v });

  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
        <input
          dir="ltr"
          className={`${inputClass} flex-1`}
          placeholder="Field label, e.g. Distance (km)"
          value={field.label}
          onChange={(e) => {
            const label = e.target.value;
            // Keep the id in step with the label until the field is saved once.
            set("label", label);
            if (!field._locked) onChange({ ...field, label, id: slugify(label) });
          }}
        />
        <select
          className={`${inputClass} w-32`}
          value={field.type}
          onChange={(e) => set("type", e.target.value)}
        >
          {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button onClick={onRemove} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {field.type === "select" && (
        <input
          dir="ltr"
          className={inputClass}
          placeholder="Options, comma separated — Car, Train, Flight"
          value={(field.options || []).join(", ")}
          onChange={(e) => set("options", e.target.value.split(",").map((o) => o.trim()).filter(Boolean))}
        />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" className="accent-[#5542F6]" checked={!!field.required}
            onChange={(e) => set("required", e.target.checked)} />
          Required
        </label>

        {field.type === "number" && (
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input
              type="checkbox" className="accent-[#5542F6]"
              checked={!!field.computed}
              onChange={(e) => set("computed", e.target.checked ? { rate: 0, into: "amount" } : null)}
            />
            Auto-calculate amount
          </label>
        )}

        {field.computed && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            Rate
            <input
              dir="ltr" type="number" min="0" step="0.01"
              className={`${inputClass} w-24 py-1`}
              value={field.computed.rate}
              onChange={(e) => set("computed", { rate: Number(e.target.value) || 0, into: "amount" })}
            />
            per unit
          </span>
        )}

        <span className="text-[11px] text-slate-400 ml-auto font-mono">{field.id}</span>
      </div>
    </div>
  );
}

/**
 * Manage expense categories and the claim form each one opens.
 *
 * @param {string} basePath role base for breadcrumbs
 */
export default function ExpenseCategoriesContent({ basePath = "/owner" }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);     // null = closed
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const res = await getExpenseCategories({ includeInactive: "true" });
    if (res.success) setCategories(res.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      description: c.description || "",
      icon: c.icon || "Receipt",
      // Existing ids must not drift when a label is edited.
      fieldSchema: (Array.isArray(c.fieldSchema) ? c.fieldSchema : []).map((f) => ({ ...f, _locked: true })),
      requiresReceipt: !!c.requiresReceipt,
      isReimbursable: !!c.isReimbursable,
      isActive: !!c.isActive,
      sortOrder: c.sortOrder ?? 0,
    });
  };

  const addField = () =>
    setForm((p) => ({
      ...p,
      fieldSchema: [...p.fieldSchema, { id: "", label: "", type: "text", required: false }],
    }));

  const save = async () => {
    if (!form.name.trim()) { setToast({ type: "error", message: "Name is required" }); return; }

    const fields = form.fieldSchema
      .filter((f) => f.label.trim())
      .map(({ _locked, ...f }) => ({ ...f, id: f.id || slugify(f.label) }));

    const ids = fields.map((f) => f.id);
    if (new Set(ids).size !== ids.length) {
      setToast({ type: "error", message: "Two fields share the same id — rename one." });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon || null,
      fieldSchema: fields,
      requiresReceipt: form.requiresReceipt,
      isReimbursable: form.isReimbursable,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    };
    const res = editingId
      ? await updateExpenseCategory(editingId, payload)
      : await createExpenseCategory(payload);
    setSaving(false);

    if (res.success) {
      setToast({ type: "success", message: editingId ? "Category updated" : "Category created" });
      setForm(null); setEditingId(null); load();
    } else {
      setToast({ type: "error", message: res.error });
    }
  };

  const remove = async () => {
    const res = await deleteExpenseCategory(deleting.id);
    if (res.success) {
      setToast({ type: "success", message: res.data ? "Category deactivated — it has expenses" : "Category deleted" });
      load();
    } else setToast({ type: "error", message: res.error });
    setDeleting(null);
  };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Expense Categories"
        description="Each category opens its own claim form. Add fields and the form adapts."
        breadcrumbs={[{ label: "Expenses", href: `${basePath}/expenses` }, { label: "Categories" }]}
        actions={
          !form && (
            <button onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]">
              <Plus className="w-4 h-4" /> New Category
            </button>
          )
        }
      />

      {form && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {editingId ? "Edit category" : "New category"}
            </h3>
            <button onClick={() => { setForm(null); setEditingId(null); }}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Name *</label>
              <input dir="ltr" className={inputClass} placeholder="Travel / Tour"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Sort order</label>
              <input dir="ltr" type="number" className={inputClass}
                value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
            <input dir="ltr" className={inputClass} placeholder="Shown under the name when picking a category"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((name) => {
                const Icon = LucideIcons[name] || Receipt;
                const on = form.icon === name;
                return (
                  <button key={name} type="button" onClick={() => setForm({ ...form, icon: name })}
                    title={name}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
                      on ? "bg-[#5542F6] text-white border-[#5542F6]"
                        : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
                    }`}>
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-[#5542F6]" checked={form.requiresReceipt}
                onChange={(e) => setForm({ ...form, requiresReceipt: e.target.checked })} />
              Receipt required
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-[#5542F6]" checked={form.isReimbursable}
                onChange={(e) => setForm({ ...form, isReimbursable: e.target.checked })} />
              Reimbursable
              <span className="text-xs text-slate-400">(off = company-paid)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-[#5542F6]" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          </div>

          {/* Form builder */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Claim form fields</p>
                <p className="text-xs text-slate-400">What the claimant is asked when they pick this category.</p>
              </div>
              <button onClick={addField}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Add field
              </button>
            </div>

            {form.fieldSchema.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-3">
                No extra fields. Claimants still give a title, amount, date and receipts.
              </p>
            ) : (
              <div className="space-y-2">
                {form.fieldSchema.map((f, i) => (
                  <FieldRow
                    key={i}
                    field={f}
                    onChange={(next) =>
                      setForm((p) => ({ ...p, fieldSchema: p.fieldSchema.map((x, j) => (j === i ? next : x)) }))
                    }
                    onRemove={() =>
                      setForm((p) => ({ ...p, fieldSchema: p.fieldSchema.filter((_, j) => j !== i) }))
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
            <button onClick={() => { setForm(null); setEditingId(null); }}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => {
            const Icon = LucideIcons[c.icon] || Receipt;
            const count = Array.isArray(c.fieldSchema) ? c.fieldSchema.length : 0;
            return (
              <div key={c.id}
                className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 ${
                  c.isActive ? "border-slate-200 dark:border-slate-800" : "border-dashed border-slate-300 dark:border-slate-700 opacity-70"
                }`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#5542F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{c.name}</h3>
                      {!c.isActive && <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </div>
                    {c.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.description}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {count} field{count === 1 ? "" : "s"}
                  </span>
                  {c.requiresReceipt && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/20">
                      Receipt required
                    </span>
                  )}
                  {!c.isReimbursable && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                      Company-paid
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => openEdit(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleting(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Delete category"
        message={`Delete "${deleting?.name}"? If any expenses use it, it will be deactivated instead so history survives.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
