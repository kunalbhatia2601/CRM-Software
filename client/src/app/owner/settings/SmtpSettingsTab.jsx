"use client";

import { useState, useTransition } from "react";
import {
  Save,
  Server,
  Mail,
  Lock,
  Hash,
  AlertCircle,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Clock,
  KeyRound,
} from "lucide-react";
import { updateSystemSettings } from "@/actions/settings.action";

import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsToggle from "@/components/settings/SettingsToggle";
import SettingsButton from "@/components/settings/SettingsButton";

export default function SmtpSettingsTab({ initialData }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    smtpHost: initialData?.smtpHost || "",
    smtpPort: initialData?.smtpPort || "",
    smtpEmail: initialData?.smtpEmail || "",
    smtpPassword: initialData?.smtpPassword || "",
    smtpIsSecure: initialData?.smtpIsSecure ?? true,
    // OTP Settings
    otpLoginEnabled: initialData?.otpLoginEnabled ?? false,
    otpDigits: initialData?.otpDigits || 6,
    otpExpiryMins: initialData?.otpExpiryMins || 5,
  });

  const isConfigured = initialData?.isSmtpConfigured || false;

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = () => {
    startTransition(async () => {
      const payload = {
        ...form,
        smtpPort: form.smtpPort ? Number(form.smtpPort) : null,
        smtpHost: form.smtpHost || null,
        smtpEmail: form.smtpEmail || null,
        smtpPassword: form.smtpPassword || null,
        otpDigits: Number(form.otpDigits),
        otpExpiryMins: Number(form.otpExpiryMins),
      };

      const result = await updateSystemSettings(payload);

      if (result.success) {
        setToast({ type: "success", message: "Email settings saved successfully!" });
        if (result.data?.smtpPassword) {
          setForm((p) => ({ ...p, smtpPassword: result.data.smtpPassword }));
        }
      } else {
        setToast({ type: "error", message: result.error || "Failed to save" });
      }

      setTimeout(() => setToast(null), 4000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast & Status Badge */}
      <div className="flex flex-col gap-3">
        {toast && (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </div>
        )}

        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium ${
            isConfigured
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200 shadow-sm dark:shadow-none"
              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 border border-amber-200 shadow-sm dark:shadow-none"
          }`}
        >
          {isConfigured ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {isConfigured
            ? "SMTP is configured and ready to send emails."
            : "SMTP is not configured. Email features will not work until configured."}
        </div>
      </div>

      {/* ─── SMTP Configuration ────────────────────────── */}
      <SettingsCard
        title="SMTP Configuration"
        description="Configure your email server for sending transactional emails, notifications, and invitations."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SettingsInput
            label="SMTP Host"
            icon={Server}
            value={form.smtpHost}
            onChange={(e) => update("smtpHost", e.target.value)}
            placeholder="smtp.gmail.com"
          />
          <SettingsInput
            label="SMTP Port"
            type="number"
            icon={Hash}
            value={form.smtpPort}
            onChange={(e) => update("smtpPort", e.target.value)}
            placeholder="465"
          />
          <SettingsInput
            label="SMTP Email"
            type="email"
            icon={Mail}
            value={form.smtpEmail}
            onChange={(e) => update("smtpEmail", e.target.value)}
            placeholder="noreply@taskgo.agency"
          />
          <SettingsInput
            label="SMTP Password / App Password"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            value={form.smtpPassword}
            onChange={(e) => update("smtpPassword", e.target.value)}
            placeholder="App-specific password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <SettingsToggle
          label="SSL/TLS Secure Connection"
          description="Use secure connection (recommended for port 465)"
          icon={Shield}
          iconColorClass="text-emerald-600"
          iconBgClass="bg-emerald-50 dark:bg-emerald-900/20"
          activeColorClass="bg-emerald-500"
          isActive={form.smtpIsSecure}
          onToggle={() => update("smtpIsSecure", !form.smtpIsSecure)}
        />

        {/* Quick Presets */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Gmail", host: "smtp.gmail.com", port: 465, secure: true },
              { name: "Outlook", host: "smtp.office365.com", port: 587, secure: false },
              { name: "Zoho", host: "smtp.zoho.in", port: 465, secure: true },
              { name: "SendGrid", host: "smtp.sendgrid.net", port: 587, secure: false },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    smtpHost: preset.host,
                    smtpPort: preset.port,
                    smtpIsSecure: preset.secure,
                  }))
                }
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all font-semibold shadow-sm dark:shadow-none"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </SettingsCard>

      {/* ─── OTP Login Settings ────────────────────────── */}
      <SettingsCard
        title="OTP Login Verification"
        description="When enabled, users will receive a one-time password via email after entering their credentials. Requires SMTP to be configured."
      >
        <div className="flex flex-col gap-6">
          <SettingsToggle
            label="Enable OTP Login"
            description={
              isConfigured
                ? "Users will receive an OTP email after entering their password"
                : "Configure SMTP first to enable OTP login"
            }
            icon={ShieldCheck}
            iconColorClass="text-indigo-600"
            iconBgClass="bg-indigo-50 dark:bg-indigo-900/20"
            activeColorClass="bg-indigo-500"
            isActive={form.otpLoginEnabled}
            onToggle={() => {
              if (!isConfigured && !form.otpLoginEnabled) return; // Block enabling without SMTP
              update("otpLoginEnabled", !form.otpLoginEnabled);
            }}
          />

          {form.otpLoginEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-1">
              <SettingsInput
                label="OTP Digits"
                type="number"
                icon={KeyRound}
                value={form.otpDigits}
                onChange={(e) => {
                  const val = Math.min(8, Math.max(4, Number(e.target.value) || 4));
                  update("otpDigits", val);
                }}
                placeholder="6"
              />
              <SettingsInput
                label="OTP Expiry (minutes)"
                type="number"
                icon={Clock}
                value={form.otpExpiryMins}
                onChange={(e) => {
                  const val = Math.min(30, Math.max(1, Number(e.target.value) || 5));
                  update("otpExpiryMins", val);
                }}
                placeholder="5"
              />
            </div>
          )}

          {!isConfigured && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-amber-50 dark:bg-amber-900/20/50 text-amber-600 border border-amber-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              SMTP must be configured before OTP login can be enabled.
            </div>
          )}
        </div>
      </SettingsCard>

      <div className="flex justify-end mt-2">
        <SettingsButton
          isPending={isPending}
          onClick={handleSave}
          label="Save Email Settings"
        />
      </div>
    </div>
  );
}
