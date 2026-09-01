"use client";

import { useState, useEffect } from "react";
import {
  X, Loader2, Check, Smartphone, Landmark, Banknote, FileText, CreditCard, MoreHorizontal, AlertCircle,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { addInvoicePayment } from "@/actions/invoices.action";

/**
 * Payment methods and the details each one actually needs.
 * `required` mirrors REQUIRED_BY_METHOD on the server — a receipt with no
 * reference is untraceable when someone queries it three months later.
 */
const METHODS = [
  {
    value: "UPI", label: "UPI", icon: Smartphone,
    fields: [
      { id: "referenceNo", label: "UTR / Transaction ref", required: true, placeholder: "12-digit UTR" },
      { id: "upiId", label: "Payer UPI ID", inDetails: true, placeholder: "name@bank" },
    ],
  },
  {
    value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark,
    fields: [
      { id: "referenceNo", label: "UTR / Reference no", required: true },
      { id: "bankName", label: "From bank", inDetails: true },
      { id: "accountLast4", label: "From account (last 4)", inDetails: true, maxLength: 4 },
    ],
  },
  {
    value: "CASH", label: "Cash", icon: Banknote,
    fields: [{ id: "receivedBy", label: "Received by", inDetails: true }],
  },
  {
    value: "CHEQUE", label: "Cheque", icon: FileText,
    fields: [
      { id: "referenceNo", label: "Cheque number", required: true },
      { id: "chequeBank", label: "Bank", inDetails: true, required: true },
      { id: "chequeDate", label: "Cheque date", inDetails: true, required: true, type: "date" },
    ],
  },
  {
    value: "CARD", label: "Card", icon: CreditCard,
    fields: [
      { id: "referenceNo", label: "Transaction id" },
      { id: "cardLast4", label: "Card (last 4)", inDetails: true, maxLength: 4 },
    ],
  },
  {
    value: "OTHER", label: "Other", icon: MoreHorizontal,
    fields: [{ id: "referenceNo", label: "Reference" }],
  },
];

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Capture how an invoice was actually paid before marking it settled.
 *
 * @param {boolean}  isOpen
 * @param {object}   invoice     needs id, total, amountPaid
 * @param {Function} onRecorded  called with the updated invoice
 * @param {Function} onClose
 */
export default function RecordPaymentModal({ isOpen, invoice, onRecorded, onClose }) {
  const { format } = useSite();

  const outstanding = Math.max(0, Number(invoice?.total || 0) - Number(invoice?.amountPaid || 0));

  const [method, setMethod] = useState("BANK_TRANSFER");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [values, setValues] = useState({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reused across invoices, so every open starts clean and pre-fills the
  // full outstanding amount — the common case.
  useEffect(() => {
    if (!isOpen) return;
    setMethod("BANK_TRANSFER");
    setAmount(outstanding > 0 ? String(outstanding) : "");
    setPaidAt(today());
    setValues({});
    setNote("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const config = METHODS.find((m) => m.value === method);
  const set = (id, v) => setValues((p) => ({ ...p, [id]: v }));

  const submit = async () => {
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter the amount received.");
    if (value > outstanding + 0.005) {
      return setError(`That is more than the ${format(outstanding)} outstanding.`);
    }

    const missing = config.fields
      .filter((f) => f.required && !String(values[f.id] ?? "").trim())
      .map((f) => f.label);
    if (missing.length) return setError(`Missing: ${missing.join(", ")}`);

    // referenceNo is a column; everything else rides in details.
    const details = {};
    for (const f of config.fields) {
      if (!f.inDetails) continue;
      const v = String(values[f.id] ?? "").trim();
      if (v) details[f.id] = v;
    }

    setError(null);
    setSaving(true);
    const res = await addInvoicePayment(invoice.id, {
      amount: value,
      method,
      paidAt,
      referenceNo: values.referenceNo?.trim() || null,
      details: Object.keys(details).length ? details : null,
      note: note.trim() || null,
    });
    setSaving(false);

    if (res.success) onRecorded?.(res.data);
    else setError(res.error);
  };

  const isPartial = Number(amount) > 0 && Number(amount) < outstanding - 0.005;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Record payment</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {invoice.invoiceNumber} · {format(outstanding)} outstanding
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Method */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">How was it paid?</label>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button"
                  onClick={() => { setMethod(value); setValues({}); setError(null); }}
                  className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    method === value
                      ? "border-[#5542F6] bg-indigo-50/60 dark:bg-indigo-900/20 text-[#5542F6]"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#5542F6]"
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Amount received *</label>
              <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
                value={amount} onChange={(e) => setAmount(e.target.value)} />
              {isPartial && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Partial — {format(outstanding - Number(amount))} will remain outstanding.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Date received</label>
              <input type="date" className={inputClass} max={today()}
                value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
          </div>

          {/* Method-specific details */}
          {config.fields.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              {config.fields.map((f) => (
                <div key={f.id} className={f.type === "date" ? "" : ""}>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    dir="ltr"
                    type={f.type || "text"}
                    maxLength={f.maxLength}
                    placeholder={f.placeholder || ""}
                    className={inputClass}
                    value={values[f.id] ?? ""}
                    onChange={(e) => set(f.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Note</label>
            <input dir="ltr" className={inputClass} placeholder="Anything worth recording"
              value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2.5 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl">
            Cancel
          </button>
          <button onClick={submit} disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Record payment
          </button>
        </div>
      </div>
    </div>
  );
}
