"use client";

import { useState } from "react";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

const GST_ROWS = [
  { key: "cgstPercent", label: "CGST %" },
  { key: "sgstPercent", label: "SGST %" },
  { key: "igstPercent", label: "IGST %" },
];

/**
 * The invoice money summary — discount, GST split, and the previous-due
 * carry-forward are all entered here.
 *
 * Layout matches how the number is actually built: Subtotal → Discount →
 * CGST/SGST/IGST (each independently overrideable) → Invoice Amount (the
 * taxed amount) → Previous Due (untaxed, carried from the project's last
 * invoice, always editable) → Grand Total.
 *
 * Discount can be typed either way round — an absolute amount or a percentage
 * of the subtotal — and each restates the other live. Only the amount is
 * stored (the schema has no discount percent), so the shown percentage is
 * always read back off the amount against the current subtotal.
 *
 * @param {{subtotal:number,disc:number,taxable:number,cgstAmt:number,sgstAmt:number,igstAmt:number,taxAmt:number,invoiceAmount:number,prevDue:number,total:number}} totals
 * @param {number|string} discountAmount
 * @param {(v: string|number) => void} onDiscountChange
 * @param {{cgstPercent:number|string, sgstPercent:number|string, igstPercent:number|string}} gst
 * @param {(field: string, v: string|number) => void} onGstChange
 * @param {number|string} previousDueAmount
 * @param {(v: string|number) => void} onPreviousDueChange
 * @param {(n: number) => string} format currency formatter
 */
export default function InvoiceTotals({
  totals, discountAmount, onDiscountChange, gst, onGstChange,
  previousDueAmount, onPreviousDueChange, format, symbol, inputClass,
}) {
  // Held separately while typing so "10." or an empty box does not get rounded
  // out from under the caret. Null means "show the value derived from the amount".
  const [pctDraft, setPctDraft] = useState(null);

  const derivedPct = totals.subtotal > 0 ? round2((totals.disc / totals.subtotal) * 100) : 0;
  const pctValue = pctDraft ?? (derivedPct || "");

  function handlePct(raw) {
    setPctDraft(raw);
    const pct = Math.min(100, Math.max(0, Number(raw) || 0));
    onDiscountChange(round2((totals.subtotal * pct) / 100));
  }

  const gstAmounts = { cgstPercent: totals.cgstAmt, sgstPercent: totals.sgstAmt, igstPercent: totals.igstAmt };
  const hasPrevDue = Number(previousDueAmount) > 0 || totals.prevDue > 0;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-slate-600 dark:text-slate-300">
        <span>Subtotal</span><span>{format(totals.subtotal)}</span>
      </div>

      <div className="flex justify-between items-center gap-2 text-slate-600 dark:text-slate-300">
        <span className="shrink-0">Discount</span>
        <div className="flex items-center gap-1.5">
          <div className="relative w-20">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
            <input
              type="number" min="0" step="0.01"
              className={`${inputClass} text-right pl-5 py-1`}
              value={discountAmount}
              onChange={(e) => { setPctDraft(null); onDiscountChange(e.target.value); }}
            />
          </div>
          <div className="relative w-16">
            <input
              type="number" min="0" max="100" step="0.01"
              className={`${inputClass} text-right pr-5 py-1`}
              placeholder="0"
              value={pctValue}
              onChange={(e) => handlePct(e.target.value)}
              onBlur={() => setPctDraft(null)}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
          </div>
        </div>
      </div>

      {totals.disc > 0 && (
        <>
          <div className="flex justify-between text-slate-500 text-xs">
            <span>Discount applied</span>
            <span>−{format(totals.disc)} · {derivedPct}% of subtotal</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
            <span>After discount</span><span>{format(totals.taxable)}</span>
          </div>
        </>
      )}

      {/* GST split — each rate applies to the same taxable base, never compounded */}
      {GST_ROWS.map((row) => (
        <div key={row.key} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
          <span>{row.label}</span>
          <div className="flex items-center gap-2">
            {Number(gst[row.key]) > 0 && (
              <span className="text-xs text-slate-400">{format(gstAmounts[row.key])}</span>
            )}
            <div className="w-24">
              <input
                type="number" min="0" max="100" step="0.01"
                className={`${inputClass} text-right py-1`}
                value={gst[row.key]}
                onChange={(e) => onGstChange(row.key, e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 pt-2">
        <span>Invoice Amount</span><span>{format(totals.invoiceAmount)}</span>
      </div>

      <div className="flex justify-between items-center gap-2 text-slate-600 dark:text-slate-300">
        <span className="shrink-0">Previous Due</span>
        <div className="relative w-28">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
          <input
            type="number" min="0" step="0.01"
            className={`${inputClass} text-right pl-5 py-1`}
            value={previousDueAmount}
            onChange={(e) => onPreviousDueChange(e.target.value)}
          />
        </div>
      </div>
      {hasPrevDue && (
        <p className="text-xs text-slate-400">Balance carried from the project's last invoice. Not taxed — edit or clear if it does not apply.</p>
      )}

      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2 flex justify-between font-bold text-slate-900 dark:text-slate-50">
        <span>Grand Total</span><span>{format(totals.total)}</span>
      </div>
    </div>
  );
}
