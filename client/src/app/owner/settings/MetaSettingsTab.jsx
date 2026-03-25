"use client";

import { useState, useTransition } from "react";
import {
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Hash,
  Globe,
  FileText,
  Loader2,
  Wifi,
  WifiOff,
  ExternalLink,
} from "lucide-react";
import { updateSystemSettings } from "@/actions/settings.action";
import { testMetaConnection } from "@/actions/campaigns.action";

import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsButton from "@/components/settings/SettingsButton";

export default function MetaSettingsTab({ initialData }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const [form, setForm] = useState({
    metaAppId: initialData?.metaAppId || "",
    metaAppSecret: initialData?.metaAppSecret || "",
    metaAccessToken: initialData?.metaAccessToken || "",
    metaAdAccountId: initialData?.metaAdAccountId || "",
    metaPageId: initialData?.metaPageId || "",
    metaWebhookVerifyToken: initialData?.metaWebhookVerifyToken || "",
  });

  const isConfigured = initialData?.isMetaConfigured || false;

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = () => {
    if (!form.metaAppId || !form.metaAccessToken || !form.metaAdAccountId) {
      showToast("error", "App ID, Access Token, and Ad Account ID are required.");
      return;
    }

    startTransition(async () => {
      const payload = {
        metaAppId: form.metaAppId || null,
        metaAppSecret: form.metaAppSecret || null,
        metaAccessToken: form.metaAccessToken || null,
        metaAdAccountId: form.metaAdAccountId || null,
        metaPageId: form.metaPageId || null,
        metaWebhookVerifyToken: form.metaWebhookVerifyToken || null,
      };

      const result = await updateSystemSettings(payload);

      if (result.success) {
        showToast("success", "Meta Ads settings saved successfully!");
        if (result.data?.metaAppSecret) {
          setForm((p) => ({ ...p, metaAppSecret: result.data.metaAppSecret }));
        }
        if (result.data?.metaAccessToken) {
          setForm((p) => ({ ...p, metaAccessToken: result.data.metaAccessToken }));
        }
      } else {
        showToast("error", result.error || "Failed to save");
      }
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testMetaConnection();
    setIsTesting(false);

    if (result.success && result.data?.connected) {
      setTestResult({
        type: "success",
        message: `Connected to "${result.data.accountName}" (${result.data.accountId}) — Currency: ${result.data.currency}`,
      });
    } else {
      setTestResult({
        type: "error",
        message: result.data?.error || result.error || "Connection failed",
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium ${
          isConfigured
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
            : "bg-amber-50 text-amber-700 border border-amber-200 shadow-sm"
        }`}
      >
        {isConfigured ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
        {isConfigured
          ? "Meta Ads is configured. You can view and manage your campaigns."
          : "Meta Ads is not configured. Add your credentials to start managing campaigns."}
      </div>

      {/* ─── API Credentials ────────────────────────── */}
      <SettingsCard
        title="Meta API Credentials"
        description="Enter your Meta (Facebook/Instagram) developer app credentials. You can find these in your Meta Developer Dashboard."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SettingsInput
            label="App ID *"
            icon={Hash}
            value={form.metaAppId}
            onChange={(e) => update("metaAppId", e.target.value)}
            placeholder="123456789012345"
          />
          <SettingsInput
            label="App Secret"
            type={showSecret ? "text" : "password"}
            icon={Lock}
            value={form.metaAppSecret}
            onChange={(e) => update("metaAppSecret", e.target.value)}
            placeholder="Your app secret"
            rightElement={
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="mb-6">
          <SettingsInput
            label="System User Access Token *"
            type={showToken ? "text" : "password"}
            icon={Lock}
            value={form.metaAccessToken}
            onChange={(e) => update("metaAccessToken", e.target.value)}
            placeholder="Long-lived system user access token"
            rightElement={
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        {/* Help */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
          <p className="text-xs font-medium text-blue-600 mb-2">Where to find these?</p>
          <div className="flex flex-col gap-1.5 text-xs text-blue-500">
            <p className="flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" />
              App ID & Secret: developers.facebook.com → Your App → Settings → Basic
            </p>
            <p className="flex items-center gap-1.5">
              <ExternalLink className="w-3 h-3" />
              Access Token: Business Manager → Business Settings → System Users → Generate Token
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* ─── Ad Account & Page ────────────────────────── */}
      <SettingsCard
        title="Ad Account & Page"
        description="Your Meta Ad Account ID and Facebook Page ID for campaign management and lead ads."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsInput
            label="Ad Account ID *"
            icon={Globe}
            value={form.metaAdAccountId}
            onChange={(e) => update("metaAdAccountId", e.target.value)}
            placeholder="act_123456789 or 123456789"
          />
          <SettingsInput
            label="Facebook Page ID"
            icon={FileText}
            value={form.metaPageId}
            onChange={(e) => update("metaPageId", e.target.value)}
            placeholder="123456789012345"
          />
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">Where to find these?</p>
          <div className="flex flex-col gap-1.5 text-xs text-slate-400">
            <p>
              Ad Account ID: Business Manager → Business Settings → Ad Accounts (format: act_XXXXXXXXX)
            </p>
            <p>
              Page ID: Your Facebook Page → About → Page ID (needed for Lead Ads)
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* ─── Webhook (Advanced) ────────────────────────── */}
      <SettingsCard
        title="Webhook Configuration"
        description="For real-time lead capture via Meta Lead Ads. Set a random verify token that Meta will use during webhook handshake."
      >
        <div className="max-w-md">
          <SettingsInput
            label="Webhook Verify Token"
            icon={Lock}
            value={form.metaWebhookVerifyToken}
            onChange={(e) => update("metaWebhookVerifyToken", e.target.value)}
            placeholder="my_random_secret_token"
          />
        </div>
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-xs text-slate-400">
            After saving, configure this webhook URL in your Meta App:
          </p>
          <code className="block mt-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 text-indigo-600 font-mono break-all">
            {typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"}/api/webhooks/meta-leads
          </code>
        </div>
      </SettingsCard>

      {/* ─── Actions ────────────────────────── */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !isConfigured}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            Test Connection
          </button>

          {testResult && (
            <span
              className={`text-sm font-medium ${
                testResult.type === "success" ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {testResult.type === "success" ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {testResult.message}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {testResult.message}
                </span>
              )}
            </span>
          )}
        </div>

        <SettingsButton
          isPending={isPending}
          onClick={handleSave}
          label="Save Meta Settings"
        />
      </div>
    </div>
  );
}
