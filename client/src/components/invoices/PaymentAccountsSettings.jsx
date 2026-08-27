"use client";

import { useState, useEffect } from "react";
import {
  Landmark, Smartphone, Plus, Pencil, Trash2, Loader2, Check, X, Star, EyeOff,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  getPaymentAccounts, createPaymentAccount, updatePaymentAccount, deletePaymentAccount,
} from "@/actions/paymentAccounts.action";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const EMPTY = {
  type: "BANK", label: "",
  bankName: "", accountNumber: "", ifscCode: "", accountHolderName: "", branch: "",
  upiId: "", upiName: "",
  isActive: true, isDefault: false, sortOrder: 0,
};

/** Mask all but the last 4 digits — full numbers only matter on the invoice. */
const maskAccount = (n) => (n && n.length > 4 ? `${"•".repeat(Math.min(8, n.length - 4))}${n.slice(-4)}` : n || "—");

/**
 * Bank and UPI accounts clients pay into.
 *
 * Owner, admin and finance manage these; one can be marked default so new
 * invoices pre-select it.
 */
export default function PaymentAccountsSettings() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    const res = await getPaymentAccounts({ includeInactive: "true" });
    if (res.success) setAccounts(res.data);
    else setToast({ type: "error", message: res.error });
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY }); };

  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({
      type: a.type, label: a.label || "",
      bankName: a.bankName || "", accountNumber: a.accountNumber || "",
      ifscCode: a.ifscCode || "", accountHolderName: a.accountHolderName || "",
      branch: a.branch || "", upiId: a.upiId || "", upiName: a.upiName || "",
      isActive: a.isActive, isDefault: a.isDefault, sortOrder: a.sortOrder ?? 0,
    });
  };

  const save = async () => {
    if (!form.label.trim()) { setToast({ type: "error", message: "Give this account a label" }); return; }
    setSaving(true);
    const payload = {
      ...form,
      label: form.label.trim(),
      sortOrder: Number(form.sortOrder) || 0,
    };
    const res = editingId
      ? await updatePaymentAccount(editingId, payload)
      : await createPaymentAccount(payload);
    setSaving(false);
    if (res.success) {
      setToast({ type: "success", message: editingId ? "Account updated" : "Account added" });
      setForm(null); setEditingId(null); load();
    } else setToast({ type: "error", message: res.error });
  };

  const remove = async () => {
    const res = await deletePaymentAccount(deleting.id);
    if (res.success) {
      setToast({ type: "success", message: res.data ? "Deactivated — it is used on invoices" : "Account deleted" });
      load();
    } else setToast({ type: "error", message: res.error });
    setDeleting(null);
  };

  const isBank = form?.type === "BANK";

  return (
    <div className="space-y-5">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">Payment Accounts</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Where clients send money. Pick one per invoice; the default is pre-selected.
          </p>
        </div>
        {!form && (
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] shrink-0">
            <Plus className="w-4 h-4" /> Add Account
          </button>
        )}
      </div>

      {form && (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-900/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {editingId ? "Edit account" : "New account"}
            </p>
            <button onClick={() => { setForm(null); setEditingId(null); }}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Type decides which fields matter */}
          <div className="flex gap-2">
            {[
              { value: "BANK", label: "Bank account", icon: Landmark },
              { value: "UPI", label: "UPI", icon: Smartphone },
            ].map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => setForm({ ...form, type: value })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.type === value
                    ? "border-[#5542F6] bg-white dark:bg-slate-900 text-[#5542F6]"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#5542F6]"
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Label *</label>
            <input dir="ltr" className={inputClass} placeholder={isBank ? "HDFC Current" : "Business UPI"}
              value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <p className="text-[11px] text-slate-400 mt-1">Internal name, so you can tell accounts apart.</p>
          </div>

          {isBank ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Bank name *</label>
                <input dir="ltr" className={inputClass} value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Account holder name *</label>
                <input dir="ltr" className={inputClass} value={form.accountHolderName}
                  onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Account number *</label>
                <input dir="ltr" className={inputClass} value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">IFSC code *</label>
                <input dir="ltr" className={`${inputClass} uppercase`} value={form.ifscCode}
                  onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500 mb-1 block">Branch</label>
                <input dir="ltr" className={inputClass} value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">UPI ID *</label>
                <input dir="ltr" className={inputClass} placeholder="name@bank"
                  value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Name *</label>
                <input dir="ltr" className={inputClass} value={form.upiName}
                  onChange={(e) => setForm({ ...form, upiName: e.target.value })} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-[#5542F6]" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-[#5542F6]" checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              Default on new invoices
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Order</label>
              <input dir="ltr" type="number" className={`${inputClass} w-20 py-1`} value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
            <button onClick={() => { setForm(null); setEditingId(null); }}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-white dark:hover:bg-slate-900 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
          <Landmark className="w-9 h-9 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No payment accounts yet.</p>
          <p className="text-xs text-slate-400 mt-1">Add one so invoices can tell clients where to pay.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {accounts.map((a) => {
            const Icon = a.type === "BANK" ? Landmark : Smartphone;
            return (
              <div key={a.id}
                className={`rounded-2xl border p-4 ${
                  a.isActive
                    ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                    : "border-dashed border-slate-300 dark:border-slate-700 opacity-70"
                }`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{a.label}</p>
                      {a.isDefault && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/20">
                          <Star className="w-2.5 h-2.5" /> Default
                        </span>
                      )}
                      {!a.isActive && <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </div>

                    {a.type === "BANK" ? (
                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        <p>{a.bankName}{a.branch ? ` · ${a.branch}` : ""}</p>
                        <p className="font-mono">{maskAccount(a.accountNumber)} · {a.ifscCode}</p>
                        <p>{a.accountHolderName}</p>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        <p className="font-mono">{a.upiId}</p>
                        <p>{a.upiName}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => openEdit(a)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleting(a)}
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
        title="Delete payment account"
        message={`Delete "${deleting?.label}"? If any invoice used it, it will be deactivated instead so those invoices keep their record.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
