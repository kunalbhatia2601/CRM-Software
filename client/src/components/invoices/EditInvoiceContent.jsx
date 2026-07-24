"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Save, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { updateInvoice } from "@/actions/invoices.action";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

const LOCKED = ["PAID", "CANCELLED"];

export default function EditInvoiceContent({ basePath, invoice }) {
  const router = useRouter();
  const { format, symbol } = useSite();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const locked = LOCKED.includes(invoice.status);

  const [items, setItems] = useState(
    (invoice.items || []).map((it) => ({
      name: it.name,
      description: it.description || "",
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
    }))
  );
  const [discountAmount, setDiscountAmount] = useState(Number(invoice.discountAmount) || 0);
  const [taxPercent, setTaxPercent] = useState(Number(invoice.taxPercent) || 0);
  const [billTo, setBillTo] = useState({
    name: invoice.billToName || "",
    email: invoice.billToEmail || "",
    address: invoice.billToAddress || "",
  });
  const [status, setStatus] = useState(invoice.status);
  const [issueDate, setIssueDate] = useState(invoice.issueDate ? invoice.issueDate.split("T")[0] : "");
  const [dueDate, setDueDate] = useState(invoice.dueDate ? invoice.dueDate.split("T")[0] : "");
  const [notes, setNotes] = useState(invoice.notes || "");
  const [terms, setTerms] = useState(invoice.terms || "");

  const showToast = (type, message) => setToast({ type, message });

  const updateItem = (idx, field, value) => setItems((p) => p.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  const addItem = () => setItems((p) => [...p, { name: "", description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const totals = useMemo(() => {
    const subtotal = round2(items.reduce((s, it) => s + round2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0));
    const disc = round2(discountAmount);
    const taxable = Math.max(0, subtotal - disc);
    const taxAmt = round2((taxable * round2(taxPercent)) / 100);
    return { subtotal, disc, taxAmt, total: round2(taxable + taxAmt) };
  }, [items, discountAmount, taxPercent]);

  const handleSave = () => {
    const validItems = items.filter((it) => it.name?.trim());
    if (validItems.length === 0) {
      showToast("error", "Add at least one line item with a name");
      return;
    }
    startTransition(async () => {
      const res = await updateInvoice(invoice.id, {
        status,
        billToName: billTo.name || null,
        billToEmail: billTo.email || null,
        billToAddress: billTo.address || null,
        items: validItems.map((it) => ({
          name: it.name,
          description: it.description || null,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })),
        discountAmount: Number(discountAmount) || 0,
        taxPercent: Number(taxPercent) || 0,
        issueDate,
        dueDate: dueDate || null,
        notes: notes || null,
        terms: terms || null,
      });
      if (res.success) {
        router.push(`${basePath}/invoices/${invoice.id}`);
      } else {
        showToast("error", res.error || "Failed to update invoice");
      }
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none";

  if (locked) {
    return (
      <div className="p-6 max-w-lg">
        <button onClick={() => router.push(`${basePath}/invoices/${invoice.id}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-300 font-medium">This invoice is {invoice.status.toLowerCase()} and can no longer be edited.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <button onClick={() => router.push(`${basePath}/invoices/${invoice.id}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <PageHeader title={`Edit ${invoice.invoiceNumber}`} description={invoice.project?.name ? `Project: ${invoice.project.name}` : ""} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Bill To</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Client / Company name" value={billTo.name} onChange={(e) => setBillTo({ ...billTo, name: e.target.value })} />
              <input className={inputClass} placeholder="Email" value={billTo.email} onChange={(e) => setBillTo({ ...billTo, email: e.target.value })} />
              <textarea className={`${inputClass} sm:col-span-2`} rows={2} placeholder="Billing address" value={billTo.address} onChange={(e) => setBillTo({ ...billTo, address: e.target.value })} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Line Items</h3>
              <button onClick={addItem} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <input className={inputClass} placeholder="Service / item name" value={it.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                    <input className={`${inputClass} mt-1.5 text-xs`} placeholder="Description (optional)" value={it.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" className={`${inputClass} text-right`} placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
                      <input type="number" min="0" step="0.01" className={`${inputClass} text-right pl-6`} placeholder="Unit price" value={it.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-span-1 text-right text-sm font-medium text-slate-700 dark:text-slate-300 pt-2">
                    {round2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                  </div>
                  <div className="col-span-1 flex justify-end pt-1.5">
                    <button onClick={() => removeItem(idx)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</label>
              <textarea className={`${inputClass} mt-1.5`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Terms</label>
              <textarea className={`${inputClass} mt-1.5`} rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500">Status</label>
                <select className={`${inputClass} mt-1`} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Issue Date</label>
                <input type="date" className={`${inputClass} mt-1`} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Due Date</label>
                <input type="date" className={`${inputClass} mt-1`} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Subtotal</span><span>{format(totals.subtotal)}</span></div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Discount</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
                  <input type="number" min="0" step="0.01" className={`${inputClass} text-right pl-5 py-1`} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Tax %</span>
                <div className="w-28">
                  <input type="number" min="0" max="100" step="0.01" className={`${inputClass} text-right py-1`} value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-between text-slate-500 text-xs"><span>Tax amount</span><span>{format(totals.taxAmt)}</span></div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2 flex justify-between font-bold text-slate-900 dark:text-slate-50">
                <span>Total</span><span>{format(totals.total)}</span>
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
