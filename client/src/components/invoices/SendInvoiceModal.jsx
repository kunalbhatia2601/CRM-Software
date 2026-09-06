"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, X, Send } from "lucide-react";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

/**
 * Confirm before an invoice leaves the building.
 *
 * Shows exactly which address it goes to, because the fallback chain — the
 * invoice's Bill To address, then the client record — is not obvious from the
 * invoice screen.
 *
 * @param {object} invoice
 * @param {string|null} senderEmail mailbox invoices are sent from, blind-copied by default
 * @param {(payload: object) => void} onSend
 */
export default function SendInvoiceModal({ isOpen, invoice, senderEmail, sending, onClose, onSend }) {
  const fallbackTo = invoice?.billToEmail || invoice?.client?.email || "";

  const [to, setTo] = useState(fallbackTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState(senderEmail || "");
  const [message, setMessage] = useState("");

  // Reset every time the dialog opens, so a previous attempt never leaks in.
  useEffect(() => {
    if (!isOpen) return;
    setTo(invoice?.billToEmail || invoice?.client?.email || "");
    setCc("");
    setBcc(senderEmail || "");
    setMessage("");
  }, [isOpen, invoice, senderEmail]);

  if (!isOpen) return null;

  const canSend = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#5542F6]/10 flex items-center justify-center shrink-0">
              <Mail className="w-4.5 h-4.5 text-[#5542F6]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Send invoice to client</h3>
              <p className="text-xs text-slate-400 truncate">
                {invoice?.invoiceNumber}
                {invoice?.billToName ? ` · ${invoice.billToName}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">To *</label>
            <input dir="ltr" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@example.com" />
            {!fallbackTo && (
              <p className="text-[11px] text-amber-600 mt-1">
                This invoice has no Bill To email, so there is nothing to fall back on — enter one.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">CC</label>
              <input dir="ltr" className={inputClass} value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">BCC</label>
              <input dir="ltr" className={inputClass} value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {senderEmail
              ? `Blind-copied to ${senderEmail} by default, so a copy stays in your inbox. Clear the field to skip it.`
              : "No sending mailbox is configured in SMTP settings, so there is no default BCC."}
          </p>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Message</label>
            <textarea
              className={inputClass}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Please find invoice ${invoice?.invoiceNumber || ""} below.`}
            />
          </div>

          <p className="text-[11px] text-slate-400">
            The invoice is attached as <strong>{invoice?.invoiceNumber}.pdf</strong>, with a summary in the email body.
            {invoice?.status === "DRAFT" && " Sending will also move this invoice from Draft to Sent."}
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend({ to: to.trim(), cc: cc.trim(), bcc: bcc.trim(), message: message.trim() })}
            disabled={!canSend || sending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5542F6] text-white text-sm font-semibold hover:bg-[#4636d4] disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending…" : "Send invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
