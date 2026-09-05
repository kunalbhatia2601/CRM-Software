"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ReceiptText, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { getProject } from "@/actions/projects.action";
import { createInvoice, getInvoiceConfig } from "@/actions/invoices.action";
import { getPaymentAccounts } from "@/actions/paymentAccounts.action";
import InvoiceLineItems, { blankItem } from "./InvoiceLineItems";
import InvoiceTotals from "./InvoiceTotals";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export default function CreateInvoiceContent({ basePath }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { format, symbol } = useSite();
  const [isPending, startTransition] = useTransition();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [items, setItems] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [billTo, setBillTo] = useState({ name: "", email: "", address: "" });
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [paymentAccountId, setPaymentAccountId] = useState("");

  useEffect(() => {
    getPaymentAccounts().then((res) => {
      if (!res.success) return;
      setPaymentAccounts(res.data);
      const fallback = res.data.find((a) => a.isDefault);
      if (fallback) setPaymentAccountId((prev) => prev || fallback.id);
    });
  }, []);

  const selectedAccount = paymentAccounts.find((a) => a.id === paymentAccountId) || null;

  const showToast = (type, message) => setToast({ type, message });

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    (async () => {
      const [res, cfg] = await Promise.all([getProject(projectId), getInvoiceConfig()]);
      if (res.success) {
        const p = res.data;
        setProject(p);
        // Prefill line items from project services (price is snapshot INR)
        const svcItems = (p.projectServices || []).map((ps) => ({
          uid: crypto.randomUUID(),
          name: ps.service?.name || "Service",
          description: Array.isArray(ps.service?.points) ? ps.service.points.join(", ") : "",
          quantity: Number(ps.quantity) || 1,
          unitPrice: Number(ps.price) || 0,
        }));
        setItems(svcItems.length ? svcItems : [blankItem()]);
        // Prefill bill-to from client
        setBillTo({
          name: p.client?.companyName || "",
          email: p.client?.email || "",
          address: p.client?.address || "",
        });
      }
      // Prefill invoice defaults from settings
      if (cfg.success && cfg.data) {
        if (cfg.data.invoiceDefaultTaxPercent) setTaxPercent(cfg.data.invoiceDefaultTaxPercent);
        if (cfg.data.invoiceDefaultDiscount) setDiscountAmount(cfg.data.invoiceDefaultDiscount);
        if (cfg.data.invoiceDefaultNotes) setNotes(cfg.data.invoiceDefaultNotes);
        if (cfg.data.invoiceDefaultTerms) setTerms(cfg.data.invoiceDefaultTerms);
      }
      setLoading(false);
    })();
  }, [projectId]);


  const totals = useMemo(() => {
    const subtotal = round2(items.reduce((s, it) => s + round2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0));
    const disc = round2(discountAmount);
    const taxable = Math.max(0, subtotal - disc);
    const taxAmt = round2((taxable * round2(taxPercent)) / 100);
    const total = round2(taxable + taxAmt);
    return { subtotal, disc, taxable, taxAmt, total };
  }, [items, discountAmount, taxPercent]);

  const handleSave = (status) => {
    if (!projectId) {
      showToast("error", "No project selected");
      return;
    }
    const validItems = items.filter((it) => it.name?.trim());
    if (validItems.length === 0) {
      showToast("error", "Add at least one line item with a name");
      return;
    }
    startTransition(async () => {
      const res = await createInvoice({
        projectId,
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
        router.push(`${basePath}/invoices/${res.data.id}`);
      } else {
        showToast("error", res.error || "Failed to create invoice");
      }
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (!projectId || !project) {
    return (
      <div className="p-6">
        <p className="text-slate-500">No project selected. Go back and pick a project.</p>
        <button onClick={() => router.push(`${basePath}/invoices`)} className="mt-4 text-sm text-indigo-600">← Back to invoices</button>
      </div>
    );
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none";

  return (
    <div className="p-6 max-w-5xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <button onClick={() => router.push(`${basePath}/invoices`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <PageHeader
        title="New Invoice"
        description={`For project: ${project.name}`}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: line items + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bill To */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Bill To</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputClass} placeholder="Client / Company name" value={billTo.name} onChange={(e) => setBillTo({ ...billTo, name: e.target.value })} />
              <input className={inputClass} placeholder="Email" value={billTo.email} onChange={(e) => setBillTo({ ...billTo, email: e.target.value })} />
              <textarea className={`${inputClass} sm:col-span-2`} rows={2} placeholder="Billing address" value={billTo.address} onChange={(e) => setBillTo({ ...billTo, address: e.target.value })} />
            </div>
          </div>

          {/* Line items */}
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
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} · {a.type === "BANK" ? a.bankName : a.upiId}
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {selectedAccount.type === "BANK"
                      ? `${selectedAccount.accountHolderName} · ${selectedAccount.accountNumber} · ${selectedAccount.ifscCode}`
                      : `${selectedAccount.upiName} · ${selectedAccount.upiId}`}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Notes + terms */}
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</label>
              <textarea className={`${inputClass} mt-1.5`} rows={2} placeholder="Notes visible on the invoice" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Terms</label>
              <textarea className={`${inputClass} mt-1.5`} rows={2} placeholder="Payment terms & conditions" value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Right: summary + dates */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Details</h3>
            <div className="space-y-3">
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

          <div className="space-y-2">
            <button
              onClick={() => handleSave("SENT")}
              disabled={isPending}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ReceiptText className="w-4 h-4" />}
              Create & Finalize
            </button>
            <button
              onClick={() => handleSave("DRAFT")}
              disabled={isPending}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
