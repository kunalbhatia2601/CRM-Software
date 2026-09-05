"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { updateInvoice } from "@/actions/invoices.action";
import { getPaymentAccounts } from "@/actions/paymentAccounts.action";
import InvoiceLineItems from "./InvoiceLineItems";
import InvoiceTotals from "./InvoiceTotals";

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
      uid: it.id,
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
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [paymentAccountId, setPaymentAccountId] = useState(invoice.paymentAccountId || "");

  useEffect(() => {
    getPaymentAccounts().then((res) => {
      if (res.success) setPaymentAccounts(res.data);
    });
  }, []);

  const selectedAccount = paymentAccounts.find((a) => a.id === paymentAccountId) || null;

  // The list only carries active accounts. If this invoice was raised against
  // one that has since been retired, show it rather than letting the select
  // fall through to "no payment details" and quietly clear it on save.
  const retiredAccount =
    paymentAccountId && !selectedAccount ? invoice.paymentAccount || { id: paymentAccountId } : null;

  /**
   * One line describing where the money goes. Falls back to the snapshot frozen
   * onto the invoice, so an account that has since been retired still reads
   * correctly instead of showing blanks.
   */
  const accountLine = (() => {
    const a = selectedAccount;
    if (a) {
      return a.type === "BANK"
        ? [a.accountHolderName, a.accountNumber, a.ifscCode].filter(Boolean).join(" · ")
        : [a.upiName, a.upiId].filter(Boolean).join(" · ");
    }
    const snap = invoice.paymentDetails;
    if (paymentAccountId && snap) {
      return snap.type === "BANK"
        ? [snap.accountHolderName, snap.accountNumber, snap.ifscCode].filter(Boolean).join(" · ")
        : [snap.upiName, snap.upiId].filter(Boolean).join(" · ");
    }
    return null;
  })();

  const showToast = (type, message) => setToast({ type, message });


  const totals = useMemo(() => {
    const subtotal = round2(items.reduce((s, it) => s + round2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0));
    const disc = round2(discountAmount);
    const taxable = Math.max(0, subtotal - disc);
    const taxAmt = round2((taxable * round2(taxPercent)) / 100);
    return { subtotal, disc, taxable, taxAmt, total: round2(taxable + taxAmt) };
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
        paymentAccountId: paymentAccountId || null,
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

          <InvoiceLineItems
            items={items}
            onChange={setItems}
            symbol={symbol}
            inputClass={inputClass}
          />

          {/* Where the client pays */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Payment account</label>
            {paymentAccounts.length === 0 ? (
              <p className="text-xs text-slate-400 italic mt-2">
                No payment accounts set up yet. Add one in settings so the client knows where to pay.
              </p>
            ) : (
              <>
                <select
                  className={`${inputClass} mt-1.5`}
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                >
                  <option value="">No payment details on this invoice</option>
                  {retiredAccount && (
                    <option value={retiredAccount.id}>
                      {retiredAccount.label || "Previous account"} · retired — pick another
                    </option>
                  )}
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} · {a.type === "BANK" ? a.bankName : a.upiId}
                    </option>
                  ))}
                </select>
                {accountLine && (
                  <p className="text-[11px] text-slate-400 mt-1.5">{accountLine}</p>
                )}
              </>
            )}
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
            <InvoiceTotals
              totals={totals}
              discountAmount={discountAmount}
              onDiscountChange={setDiscountAmount}
              taxPercent={taxPercent}
              onTaxChange={setTaxPercent}
              format={format}
              symbol={symbol}
              inputClass={inputClass}
            />
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
