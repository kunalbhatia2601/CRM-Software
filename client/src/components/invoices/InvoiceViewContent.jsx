"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Loader2, CheckCircle2, Pencil, Mail } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { updateInvoice, getInvoiceConfig, sendInvoiceEmail } from "@/actions/invoices.action";
import RecordPaymentModal from "@/components/invoices/RecordPaymentModal";
import SendInvoiceModal from "@/components/invoices/SendInvoiceModal";

/** A4 in millimetres, and the print margin the @page rule uses. */
const A4 = { width: 210, height: 297, margin: 12 };

/**
 * Usable height of one printed page: A4 minus the top and bottom @page margins.
 * Content flows through the document in slices of exactly this height, so a
 * watermark placed at every multiple of it lands once per sheet of paper.
 */
const PAGE_CONTENT_MM = A4.height - A4.margin * 2;

const PAYMENT_METHOD_LABEL = {
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CASH: "Cash",
  CHEQUE: "Cheque",
  CARD: "Card",
  OTHER: "Other",
};

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-emerald-100 text-emerald-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400 line-through",
};

// A paid or cancelled invoice is locked; anything else is editable.
const isEditable = (status) => !["PAID", "CANCELLED"].includes(status);

export default function InvoiceViewContent({ basePath, invoice: initial, readOnly = false }) {
  const router = useRouter();
  const site = useSite();
  const { format } = site;
  const [invoice, setInvoice] = useState(initial);
  // The snapshot taken when the account was chosen — not the live record.
  // Declared after `invoice` exists, or it reads it in the temporal dead zone.
  const pay = invoice.paymentDetails || null;
  const [toast, setToast] = useState(null);
  const [paying, setPaying] = useState(false);
  const [bg, setBg] = useState({ image: null, opacity: 0.05 });
  const [senderEmail, setSenderEmail] = useState(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // How many A4 sheets the invoice currently spans, so the preview can show the
  // same page breaks — and the same repeated watermark — that printing gives.
  const sheetRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const [printPages, setPrintPages] = useState(1);
  // The sheet is always laid out at true A4 width so the preview matches the
  // printout; when the window is narrower it is scaled down to fit, never
  // reflowed — reflowing would show a layout the printer will never produce.
  const viewportRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await getInvoiceConfig();
      if (res.success) {
        setBg({ image: res.data.invoiceBgImage || null, opacity: res.data.invoiceBgOpacity ?? 0.05 });
        setSenderEmail(res.data.senderEmail || null);
      }
    })();
  }, []);

  // Millimetres only mean something on screen once the browser tells us how
  // many pixels one is, so the page height is measured rather than assumed.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const measure = () => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;visibility:hidden;height:100mm";
      document.body.appendChild(probe);
      const pxPerMm = probe.offsetHeight / 100;
      probe.remove();

      const pageHeightPx = A4.height * pxPerMm;
      if (!pageHeightPx) return;

      setPageCount(Math.max(1, Math.ceil(el.scrollHeight / pageHeightPx)));

      // Print slices are shorter than the paper, because @page eats 12mm top
      // and bottom. Counting in paper heights would under-count the sheets.
      const slicePx = PAGE_CONTENT_MM * pxPerMm;
      setPrintPages(Math.max(1, Math.ceil(el.scrollHeight / slicePx) + 1));

      // Shrink to fit the available width, but never enlarge past 100%.
      const available = viewportRef.current?.clientWidth || 0;
      const sheetPx = A4.width * pxPerMm;
      setScale(available && sheetPx ? Math.min(1, available / sheetPx) : 1);
      setSheetHeight(el.scrollHeight);
    };

    measure();

    // Fonts, the logo and the watermark all land late and change the height.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [invoice, bg.image]);

  const showToast = (type, message) => setToast({ type, message });

  const onPaymentRecorded = (updated) => {
    setInvoice(updated);
    setPaying(false);
    showToast(
      "success",
      updated.status === "PAID" ? "Invoice settled" : "Payment recorded"
    );
  };

  // Set the PDF/print filename to INV_ID(4)-ProjectName, and collapse the
  // browser's footer URL to just the invoice id, then restore both after.
  /** Email the invoice. A draft is moved to Sent by the server, so reflect that. */
  const handleSend = async (payload) => {
    setSending(true);
    const res = await sendInvoiceEmail(invoice.id, payload);
    setSending(false);

    if (!res.success) {
      setToast({ type: "error", message: res.error || "Failed to send invoice" });
      return;
    }

    setSendOpen(false);
    setToast({ type: "success", message: res.message || `Invoice sent to ${res.data?.to}` });
    if (invoice.status === "DRAFT") setInvoice((prev) => ({ ...prev, status: "SENT" }));
  };

  const handlePrint = () => {
    const idPart = (invoice.invoiceNumber || invoice.id || "").toString().slice(-4);
    const projName = (invoice.project?.name || "invoice").replace(/[^\w-]+/g, "_");
    const prevTitle = document.title;
    const prevUrl = window.location.href;

    document.title = `${idPart}-${projName}`;
    try {
      window.history.replaceState(null);
    } catch {}

    window.print();

    setTimeout(() => {
      document.title = prevTitle;
      try { window.history.replaceState(null, "", prevUrl); } catch {}
    }, 500);
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

  return (
    <div className="p-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Outside the printable sheet on purpose. */}
      <RecordPaymentModal
        isOpen={paying}
        invoice={invoice}
        onClose={() => setPaying(false)}
        onRecorded={onPaymentRecorded}
      />

      <SendInvoiceModal
        isOpen={sendOpen}
        invoice={invoice}
        senderEmail={senderEmail}
        sending={sending}
        onClose={() => setSendOpen(false)}
        onSend={handleSend}
      />

      {/* Toolbar — hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => router.push(`${basePath}/invoices`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {!readOnly && isEditable(invoice.status) && (
            <button onClick={() => router.push(`${basePath}/invoices/${invoice.id}/edit`)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
          {!readOnly && invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
            <button onClick={() => setPaying(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl">
              <CheckCircle2 className="w-4 h-4" /> Record Payment
            </button>
          )}
          {!readOnly && invoice.status !== "CANCELLED" && (
            <button
              onClick={() => setSendOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#5542F6] bg-[#5542F6]/10 hover:bg-[#5542F6]/20 rounded-xl"
            >
              <Mail className="w-4 h-4" /> Send to Client
            </button>
          )}
          <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]">
            <Printer className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Invoice sheet — white base; watermark only if a bg image is configured.
          min-h keeps an A4-ish page so a `contain` background shows the whole image. */}
      {/* Scaling viewport. The sheet keeps true A4 dimensions and is scaled as a
          whole, so what is on screen is the printed page at a smaller size —
          not a narrower layout that would break differently on paper. The
          wrapper carries the scaled height so the page below it does not gap. */}
      <div ref={viewportRef} className="invoice-viewport w-full print:contents">
        <div
          className="mx-auto print:!h-auto"
          style={{
            width: `${A4.width}mm`,
            maxWidth: "100%",
            height: sheetHeight ? sheetHeight * scale : undefined,
          }}
        >
          <div
            ref={sheetRef}
            className="invoice-sheet relative bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-sm print:shadow-none print:border-0 print:rounded-none"
            style={{
              width: `${A4.width}mm`,
              minHeight: `${A4.height}mm`,
              transform: scale < 1 ? `scale(${scale})` : undefined,
              transformOrigin: "top left",
            }}
          >
        {/* One watermark per A4 sheet, matching what the printer produces.
            A single stretched image would be sliced at each page break. */}
        {bg.image &&
          Array.from({ length: pageCount }, (_, i) => (
            <div
              key={i}
              className="invoice-bg pointer-events-none absolute left-0 right-0 print:hidden"
              style={{
                top: `${i * A4.height}mm`,
                height: `${A4.height}mm`,
                backgroundImage: `url(${bg.image})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                backgroundSize: "contain",
                opacity: bg.opacity,
              }}
            />
          ))}

        {/* One watermark per printed sheet.
            A single page-fixed element would be simpler, but Chrome paints
            fixed elements on the first page only — which is exactly why page 2
            came out blank. These are ordinary absolute boxes placed at every
            multiple of the printable page height, so each one falls on its own
            sheet as the content flows. */}
        {bg.image &&
          Array.from({ length: printPages }, (_, i) => (
            <div
              key={i}
              className="invoice-bg-print pointer-events-none absolute left-0 right-0 hidden print:block"
              style={{
                top: `${i * PAGE_CONTENT_MM}mm`,
                height: `${PAGE_CONTENT_MM}mm`,
                backgroundImage: `url(${bg.image})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center center",
                backgroundSize: "contain",
                opacity: bg.opacity,
              }}
            />
          ))}

        {/* Where each sheet of paper ends. Screen only — it is a guide, not part
            of the document. */}
        {pageCount > 1 &&
          Array.from({ length: pageCount - 1 }, (_, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-slate-300 print:hidden"
              style={{ top: `${(i + 1) * A4.height}mm` }}
            >
              <span className="absolute right-2 -top-2.5 bg-white px-1.5 text-[10px] font-medium text-slate-400">
                Page {i + 2}
              </span>
            </div>
          ))}

        <div className="relative" style={{ padding: `${A4.margin}mm` }}>
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
          <table className="w-full mb-8 table-fixed">
            {/* Fixed widths: without them the description takes every spare pixel
                and the three money columns collapse into each other. */}
            <colgroup>
              <col />
              <col className="w-14" />
              <col className="w-28" />
              <col className="w-32" />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-[11px] text-slate-400 uppercase tracking-wide">
                <th className="py-2 pr-4 font-semibold">Description</th>
                <th className="py-2 pl-2 font-semibold text-right">Qty</th>
                <th className="py-2 pl-3 font-semibold text-right">Unit Price</th>
                <th className="py-2 pl-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((it) => (
                <tr key={it.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-800 break-words">{it.name}</p>
                    {it.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words">
                        {it.description}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pl-2 text-right text-slate-600 tabular-nums whitespace-nowrap">
                    {Number(it.quantity)}
                  </td>
                  <td className="py-3 pl-3 text-right text-slate-600 tabular-nums whitespace-nowrap">
                    {format(it.unitPrice)}
                  </td>
                  <td className="py-3 pl-3 text-right font-medium text-slate-800 tabular-nums whitespace-nowrap">
                    {format(it.amount)}
                  </td>
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

      {/* What has been received, and how */}
      {invoice.payments?.length > 0 && (
        <div className="border-t border-slate-100 pt-6 mb-6">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Payments Received
          </p>
          <table className="w-full text-sm">
            <tbody>
              {invoice.payments.map((pmt) => (
                <tr key={pmt.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 pr-3 text-slate-600 whitespace-nowrap">{fmtDate(pmt.paidAt)}</td>
                  <td className="py-2 px-2 text-slate-600">{PAYMENT_METHOD_LABEL[pmt.method] || pmt.method}</td>
                  <td className="py-2 px-2 text-slate-500 font-mono text-xs">{pmt.referenceNo || "—"}</td>
                  <td className="py-2 pl-2 text-right font-medium text-slate-800">{format(pmt.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Where to pay — read from the invoice's own snapshot, never the
              live account, so a later edit cannot change a sent invoice. */}
          {pay && (
            <div className="border-t border-slate-100 pt-6 mb-6">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Payment Details
              </p>
              {pay.type === "BANK" ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm max-w-lg">
                  <div className="flex justify-between"><span className="text-slate-400">Bank</span><span className="text-slate-700 font-medium">{pay.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Account name</span><span className="text-slate-700 font-medium">{pay.accountHolderName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Account no.</span><span className="text-slate-700 font-mono font-medium">{pay.accountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">IFSC</span><span className="text-slate-700 font-mono font-medium">{pay.ifscCode}</span></div>
                  {pay.branch && (
                    <div className="flex justify-between col-span-2"><span className="text-slate-400">Branch</span><span className="text-slate-700">{pay.branch}</span></div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm max-w-lg">
                  <div className="flex justify-between"><span className="text-slate-400">UPI ID</span><span className="text-slate-700 font-mono font-medium">{pay.upiId}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Name</span><span className="text-slate-700 font-medium">{pay.upiName}</span></div>
                </div>
              )}
            </div>
          )}

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
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        .invoice-bg, .invoice-bg-print { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @media print {
          body * { visibility: hidden; }
          .invoice-sheet, .invoice-sheet * { visibility: visible; }
          .invoice-sheet {
            position: absolute; left: 0; top: 0; width: 100%; max-width: none; margin: 0;
            /* The screen fit-to-width scale must not reach the paper, and a
               transform would also trap the watermark boxes in a new containing
               block. */
            transform: none !important;
            /* The last watermark box can extend past the final line of content,
               so the sheet must not clip it. */
            overflow: visible !important;
            /* The sheet is as tall as its content; the A4 page height comes from
               @page, so this must not force an extra blank page. */
            min-height: 0 !important;
          }

          /* The watermark stack is plain absolute boxes in the markup, one per
             printed page. Nothing to reposition here — only the colour-adjust
             hint, so the browser does not drop the faded image as "background
             graphics". */
          .invoice-bg-print {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            z-index: 0;
          }

          /* Keep the content above the watermark on every page, and drop the
             screen padding — @page already supplies the 12mm paper margin, and
             keeping both would indent every page twice. */
          .invoice-sheet > .relative {
            position: relative;
            z-index: 1;
            padding: 0 !important;
          }

          /* The screen sizer reserves the scaled height; on paper the sheet
             sizes itself. */
          .invoice-viewport, .invoice-viewport > div {
            width: auto !important;
            height: auto !important;
            max-width: none !important;
            margin: 0 !important;
          }

          /* Never split a line item, or a total, across two sheets. */
          .invoice-sheet tr,
          .invoice-sheet thead { break-inside: avoid; page-break-inside: avoid; }
          .invoice-sheet thead { display: table-header-group; }

          /* Printing is always A4 here, so the page box is stated outright
             rather than left to the browser's default paper size. */
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </div>
  );
}
