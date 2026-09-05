"use client";

import { useState } from "react";

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * The invoice money summary, and the only place discount and tax are entered.
 *
 * Discount can be typed either way round — an absolute amount or a percentage
 * of the subtotal — and each restates the other live. Only the amount is stored
 * (the schema has no discount percent, unlike tax), so the percentage shown is
 * always read back off the amount against the current subtotal.
 *
 * @param {{subtotal:number,disc:number,taxable:number,taxAmt:number,total:number}} totals
 * @param {number|string} discountAmount
 * @param {(v: string|number) => void} onDiscountChange
 * @param {number|string} taxPercent
 * @param {(v: string|number) => void} onTaxChange
 * @param {(n: number) => string} format currency formatter
 */
export default function InvoiceTotals({
  totals, discountAmount, onDiscountChange, taxPercent, onTaxChange, format, symbol, inputClass,
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

      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
        <span>Tax %</span>
        <div className="w-28">
          <input
            type="number" min="0" max="100" step="0.01"
            className={`${inputClass} text-right py-1`}
            value={taxPercent}
            onChange={(e) => onTaxChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between text-slate-500 text-xs">
        <span>Tax amount</span><span>{format(totals.taxAmt)}</span>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 mt-2 flex justify-between font-bold text-slate-900 dark:text-slate-50">
        <span>Total</span><span>{format(totals.total)}</span>
      </div>
    </div>
  );
}
