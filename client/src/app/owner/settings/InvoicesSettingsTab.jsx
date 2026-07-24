"use client";

import { useState, useRef, useTransition } from "react";
import { Check, AlertCircle, ImageIcon, Loader2, Trash2, Percent, Receipt } from "lucide-react";
import SettingsCard from "@/components/settings/SettingsCard";
import { updateSystemSettings } from "@/actions/settings.action";
import { useUpload } from "@/hooks/useUpload";

export default function InvoicesSettingsTab({ initialData }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const { upload, uploading, progress, error: uploadError } = useUpload();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    invoiceBgImage: initialData?.invoiceBgImage || "",
    invoiceBgOpacity: initialData?.invoiceBgOpacity ?? 0.05,
    invoiceDefaultTaxPercent: initialData?.invoiceDefaultTaxPercent ?? 0,
    invoiceDefaultDiscount: initialData?.invoiceDefaultDiscount ?? 0,
    invoiceDefaultNotes: initialData?.invoiceDefaultNotes || "",
    invoiceDefaultTerms: initialData?.invoiceDefaultTerms || "",
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = () => {
    startTransition(async () => {
      const payload = {
        invoiceBgImage: form.invoiceBgImage || null,
        invoiceBgOpacity: Number(form.invoiceBgOpacity),
        invoiceDefaultTaxPercent: Number(form.invoiceDefaultTaxPercent) || 0,
        invoiceDefaultDiscount: Number(form.invoiceDefaultDiscount) || 0,
        invoiceDefaultNotes: form.invoiceDefaultNotes || null,
        invoiceDefaultTerms: form.invoiceDefaultTerms || null,
      };
      const res = await updateSystemSettings(payload);
      setToast(res.success
        ? { type: "success", message: "Invoice settings saved!" }
        : { type: "error", message: res.error || "Failed to save" });
      setTimeout(() => setToast(null), 4000);
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none";

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
          toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Background image + live preview */}
      <SettingsCard title="Invoice Background" description="Watermark shown behind every invoice and in the downloaded PDF. Leave empty for a plain white background.">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-[88px] h-[88px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                {form.invoiceBgImage ? (
                  <img src={form.invoiceBgImage} alt="bg" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <ImageIcon className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const r = await upload(file);
                  if (r?.fileUrl) update("invoiceBgImage", r.fileUrl);
                  e.target.value = "";
                }} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  {uploading ? `Uploading ${progress}%` : "Choose Image"}
                </button>
                {form.invoiceBgImage && !uploading && (
                  <button type="button" onClick={() => update("invoiceBgImage", "")} className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
                {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Opacity</span>
                <span className="font-mono">{Number(form.invoiceBgOpacity).toFixed(2)}</span>
              </label>
              <input type="range" min="0" max="1" step="0.01" value={form.invoiceBgOpacity}
                onChange={(e) => update("invoiceBgOpacity", e.target.value)}
                className="w-full mt-2 accent-[#5542F6]" />
            </div>
          </div>

          {/* Live preview */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Live Preview</p>
            <div className="relative aspect-[3/4] rounded-xl border border-slate-200 dark:border-slate-700 bg-white overflow-hidden">
              {form.invoiceBgImage && (
                <div className="absolute inset-0 bg-no-repeat bg-center bg-contain"
                  style={{ backgroundImage: `url(${form.invoiceBgImage})`, opacity: Number(form.invoiceBgOpacity) }} />
              )}
              <div className="relative p-4 text-slate-800">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-bold">Your Agency</div>
                  <div className="text-lg font-bold text-slate-700">INVOICE</div>
                </div>
                <div className="mt-6 h-2 w-1/2 bg-slate-200 rounded" />
                <div className="mt-2 h-2 w-1/3 bg-slate-100 rounded" />
                <div className="mt-6 space-y-1.5">
                  <div className="h-2 w-full bg-slate-100 rounded" />
                  <div className="h-2 w-full bg-slate-100 rounded" />
                  <div className="h-2 w-3/4 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Defaults */}
      <SettingsCard title="Invoice Defaults" description="Pre-filled when creating a new invoice. Can be overridden per invoice.">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><Percent className="w-3 h-3" /> Default Tax %</label>
            <input type="number" min="0" max="100" step="0.01" className={`${inputClass} mt-1`} value={form.invoiceDefaultTaxPercent} onChange={(e) => update("invoiceDefaultTaxPercent", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1"><Receipt className="w-3 h-3" /> Default Discount (amount)</label>
            <input type="number" min="0" step="0.01" className={`${inputClass} mt-1`} value={form.invoiceDefaultDiscount} onChange={(e) => update("invoiceDefaultDiscount", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500">Default Notes</label>
            <textarea rows={2} className={`${inputClass} mt-1`} placeholder="Notes shown on every new invoice" value={form.invoiceDefaultNotes} onChange={(e) => update("invoiceDefaultNotes", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500">Default Terms</label>
            <textarea rows={3} className={`${inputClass} mt-1`} placeholder="Payment terms & conditions" value={form.invoiceDefaultTerms} onChange={(e) => update("invoiceDefaultTerms", e.target.value)} />
          </div>
        </div>
      </SettingsCard>

      <div>
        <button onClick={handleSave} disabled={isPending || uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Invoice Settings
        </button>
      </div>
    </div>
  );
}
