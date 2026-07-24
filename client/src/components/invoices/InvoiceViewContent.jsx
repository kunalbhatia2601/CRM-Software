"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Loader2, CheckCircle2 } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { updateInvoice } from "@/actions/invoices.action";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400 line-through",
};

// Background watermark image shown behind invoice body (screen + print).
const BG_IMAGE = "/images/mask-group-1.webp";

export default function InvoiceViewContent({ basePath, invoice: initial }) {
  const router = useRouter();
  const site = useSite();
  const { format } = site;
  const [invoice, setInvoice] = useState(initial);
  const [toast, setToast] = useState(null);
  const [marking, setMarking] = useState(false);

  const showToast = (type, message) => setToast({ type, message });

  const markPaid = async () => {
    setMarking(true);
    const res = await updateInvoice(invoice.id, { amountPaid: Number(invoice.total) });
    setMarking(false);
    if (res.success) {
      setInvoice(res.data);
      showToast("success", "Marked as paid");
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  const handlePrint = () => window.print();

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—");

  return (
    <div className="p-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => router.push(`${basePath}/invoices`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <button onClick={markPaid} disabled={marking} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl disabled:opacity-60">
              {marking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark Paid
            </button>
          )}
          <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]">
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Invoice sheet */}
      <div className="invoice-sheet relative mx-auto max-w-3xl bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-0 print:rounded-none">
        {/* Background watermark */}
        <div
          className="pointer-events-none absolute inset-0 bg-no-repeat bg-center bg-contain opacity-[0.04] print:opacity-[0.05]"
          style={{ backgroundImage: `url(${BG_IMAGE})` }}
        />

        <div className="relative p-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              {site.logo && (
                <img src={site.logo} alt={site.name} className="h-10 mb-3" onError={(e) => { e.target.style.display = "none"; }} />
              )}
              <h1 className="text-xl font-bold">{site.name || "TaskGo Agency"}</h1>
              {site.address && <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{site.address}</p>}
              {site.contactEmail && <p className="text-xs text-slate-500">{site.contactEmail}</p>}
              {site.contactPhone && <p className="text-xs text-slate-500">{site.contactPhone}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold tracking-tight text-slate-800">INVOICE</h2>
              <p className="text-sm font-mono text-slate-500 mt-1">{invoice.invoiceNumber}</p>
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_STYLES[invoice.status] || ""}`}>
                {invoice.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Bill to + meta */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bill To</p>
              <p className="font-semibold text-slate-800">{invoice.billToName || "—"}</p>
              {invoice.billToEmail && <p className="text-sm text-slate-500">{invoice.billToEmail}</p>}
              {invoice.billToAddress && <p className="text-sm text-slate-500 whitespace-pre-line mt-0.5">{invoice.billToAddress}</p>}
              {invoice.project?.name && <p className="text-xs text-slate-400 mt-2">Project: {invoice.project.name}</p>}
            </div>
            <div className="text-right space-y-1">
              <div className="flex justify-end gap-6"><span className="text-xs text-slate-400">Issue Date</span><span className="text-sm font-medium w-28 text-right">{fmtDate(invoice.issueDate)}</span></div>
              <div className="flex justify-end gap-6"><span className="text-xs text-slate-400">Due Date</span><span className="text-sm font-medium w-28 text-right">{fmtDate(invoice.dueDate)}</span></div>
              {invoice.paidAt && <div className="flex justify-end gap-6"><span className="text-xs text-slate-400">Paid On</span><span className="text-sm font-medium w-28 text-right">{fmtDate(invoice.paidAt)}</span></div>}
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-[11px] text-slate-400 uppercase tracking-wide">
                <th className="py-2 font-semibold">Description</th>
                <th className="py-2 font-semibold text-right">Qty</th>
                <th className="py-2 font-semibold text-right">Unit Price</th>
                <th className="py-2 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((it) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-800">{it.name}</p>
                    {it.description && <p className="text-xs text-slate-500 mt-0.5">{it.description}</p>}
                  </td>
                  <td className="py-3 text-right text-slate-600">{Number(it.quantity)}</td>
                  <td className="py-3 text-right text-slate-600">{format(it.unitPrice)}</td>
                  <td className="py-3 text-right font-medium text-slate-800">{format(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{format(invoice.subtotal)}</span></div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-slate-600"><span>Discount</span><span>− {format(invoice.discountAmount)}</span></div>
              )}
              {Number(invoice.taxPercent) > 0 && (
                <div className="flex justify-between text-slate-600"><span>Tax ({Number(invoice.taxPercent)}%)</span><span>{format(invoice.taxAmount)}</span></div>
              )}
              <div className="flex justify-between border-t-2 border-slate-200 pt-2 font-bold text-slate-900 text-base">
                <span>Total</span><span>{format(invoice.total)}</span>
              </div>
              {Number(invoice.amountPaid) > 0 && (
                <>
                  <div className="flex justify-between text-emerald-600"><span>Paid</span><span>{format(invoice.amountPaid)}</span></div>
                  <div className="flex justify-between font-semibold text-slate-900"><span>Balance</span><span>{format(Number(invoice.total) - Number(invoice.amountPaid))}</span></div>
                </>
              )}
            </div>
          </div>

          {/* Notes + terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-6">
              {invoice.notes && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Terms</p>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-10">Thank you for your business.</p>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-sheet, .invoice-sheet * { visibility: visible; }
          .invoice-sheet { position: absolute; left: 0; top: 0; width: 100%; max-width: none; margin: 0; }
          @page { margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
