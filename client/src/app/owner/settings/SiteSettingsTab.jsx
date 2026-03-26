"use client";

import { useState, useTransition } from "react";
import {
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  Banknote,
  ArrowLeftRight,
  AlertCircle,
  Check,
  Loader2,
  Shield,
} from "lucide-react";
import { updateSiteSettings } from "@/actions/settings.action";

import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsToggle from "@/components/settings/SettingsToggle";
import SettingsButton from "@/components/settings/SettingsButton";
import SettingsSelect from "@/components/settings/SettingsSelect";

const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)", value: "INR" },
  { code: "USD", label: "US Dollar ($)", value: "USD" },
  { code: "EUR", label: "Euro (€)", value: "EUR" },
];

export default function SiteSettingsTab({ initialData }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    logo: initialData?.logo || "",
    contactEmail: initialData?.contactEmail || "",
    contactPhone: initialData?.contactPhone || "",
    address: initialData?.address || "",
    currency: initialData?.currency || "INR",
    usdToInr: initialData?.usdToInr || 92,
    eurToInr: initialData?.eurToInr || 105,
    isMaintenanceMode: initialData?.isMaintenanceMode || false,
    isDemoMode: initialData?.isDemoMode || false,
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = () => {
    startTransition(async () => {
      const payload = {
        ...form,
        usdToInr: Number(form.usdToInr),
        eurToInr: Number(form.eurToInr),
      };

      const result = await updateSiteSettings(payload);

      if (result.success) {
        setToast({ type: "success", message: "Site settings saved successfully!" });
      } else {
        setToast({ type: "error", message: result.error || "Failed to save" });
      }

      setTimeout(() => setToast(null), 4000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200 shadow-sm dark:shadow-none"
              : "bg-red-50 text-red-700 border border-red-200 shadow-sm dark:shadow-none"
          }`}
        >
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* ═══ Card 1: General Info ═══ */}
      <SettingsCard
        title="General Information"
        description="Basic details about your agency displayed across the system."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsInput
            label="Site Name"
            icon={Building}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="TaskGo Agency"
          />
          <SettingsInput
            label="Logo URL"
            value={form.logo}
            onChange={(e) => update("logo", e.target.value)}
            placeholder="/logo.svg or https://..."
          />
          <SettingsInput
            label="Contact Email"
            type="email"
            icon={Mail}
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            placeholder="hello@taskgo.agency"
          />
          <SettingsInput
            label="Contact Phone"
            icon={Phone}
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            placeholder="+91 82848-34841"
          />

          {/* Address (full width) */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Address</label>
            <div className="relative flex items-start">
              <div className="absolute left-4 top-3.5 flex justify-center items-center pointer-events-none">
                <MapPin className="w-5 h-5 text-slate-400" />
              </div>
              <textarea
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Chandigarh, India"
                rows={3}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all resize-none shadow-sm dark:shadow-none"
              />
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* ═══ Card 2: Currency & Exchange Rates ═══ */}
      <SettingsCard
        title="Currency & Exchange Rates"
        description="Set your display currency and exchange rates. All monetary values are stored in INR and converted on display."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SettingsSelect
            label="Display Currency"
            icon={Banknote}
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
            options={CURRENCIES}
          />

          <SettingsInput
            label="1 USD = ? INR"
            type="number"
            icon={ArrowLeftRight}
            step="0.01"
            min="0"
            value={form.usdToInr}
            onChange={(e) => update("usdToInr", e.target.value)}
          />

          <SettingsInput
            label="1 EUR = ? INR"
            type="number"
            icon={ArrowLeftRight}
            step="0.01"
            min="0"
            value={form.eurToInr}
            onChange={(e) => update("eurToInr", e.target.value)}
          />
        </div>

        {/* Preview conversion */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Preview (based on current rates)</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-300 font-medium tracking-tight">
            <span>₹1,00,000 = ${(100000 / (Number(form.usdToInr) || 92)).toFixed(2)} USD</span>
            <span className="text-slate-300">|</span>
            <span>₹1,00,000 = €{(100000 / (Number(form.eurToInr) || 105)).toFixed(2)} EUR</span>
            <span className="text-slate-300">|</span>
            <span>$1,000 = ₹{(1000 * (Number(form.usdToInr) || 92)).toLocaleString("en-IN")} INR</span>
          </div>
        </div>
      </SettingsCard>

      {/* ═══ Card 3: System Modes ═══ */}
      <SettingsCard
        title="System Modes"
        description="Toggle system-wide modes for maintenance or demonstration."
      >
        <div className="flex flex-col gap-4">
          <SettingsToggle
            label="Maintenance Mode"
            description="Show maintenance page to visitors"
            icon={Shield}
            iconColorClass="text-amber-600"
            iconBgClass="bg-amber-50 dark:bg-amber-900/20"
            activeColorClass="bg-amber-500"
            isActive={form.isMaintenanceMode}
            onToggle={() => update("isMaintenanceMode", !form.isMaintenanceMode)}
          />

          <SettingsToggle
            label="Demo Mode"
            description="Enable demo features and sample data indicators"
            icon={Shield}
            iconColorClass="text-blue-600"
            iconBgClass="bg-blue-50"
            activeColorClass="bg-blue-500"
            isActive={form.isDemoMode}
            onToggle={() => update("isDemoMode", !form.isDemoMode)}
          />
        </div>
      </SettingsCard>

      <div className="flex justify-end mt-2">
        <SettingsButton
          isPending={isPending}
          onClick={handleSave}
          label="Save Site Settings"
        />
      </div>
    </div>
  );
}
