"use client";

import { useState, useTransition } from "react";
import {
  Database,
  Key,
  Globe,
  MapPin,
  FolderOpen,
  Link2,
  Server,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  HardDrive,
  Cloud,
  Cloudy,
  Webhook,
} from "lucide-react";
import { updateSystemSettings } from "@/actions/settings.action";

import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsButton from "@/components/settings/SettingsButton";

const PROVIDERS = [
  {
    id: "LOCAL",
    name: "Local Storage",
    description: "Store files on the server. Simple setup, no external services needed.",
    icon: HardDrive,
    color: "from-slate-500 to-gray-600",
    bgColor: "bg-slate-50 dark:bg-slate-900",
    borderColor: "border-slate-300 dark:border-slate-600",
    activeRing: "ring-slate-500",
  },
  {
    id: "S3",
    name: "AWS S3",
    description: "Amazon S3 cloud storage. Highly scalable and reliable.",
    icon: Cloud,
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
    borderColor: "border-orange-300 dark:border-orange-700",
    activeRing: "ring-orange-500",
  },
  {
    id: "R2",
    name: "Cloudflare R2",
    description: "S3-compatible storage with zero egress fees.",
    icon: Cloudy,
    color: "from-blue-500 to-cyan-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-300 dark:border-blue-700",
    activeRing: "ring-blue-500",
  },
  {
    id: "CUSTOM",
    name: "Custom / Own Setup",
    description: "Use your own upload endpoint. Full control over file handling.",
    icon: Webhook,
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-300 dark:border-violet-700",
    activeRing: "ring-violet-500",
  },
];

export default function StorageSettingsTab({ initialData }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  const [form, setForm] = useState({
    storageProvider: initialData?.storageProvider || "LOCAL",
    // S3 / R2
    storageAccessKeyId: initialData?.storageAccessKeyId || "",
    storageSecretKey: initialData?.storageSecretKey || "",
    storageEndpoint: initialData?.storageEndpoint || "",
    storageRegion: initialData?.storageRegion || "",
    storageBucket: initialData?.storageBucket || "",
    storagePublicUrl: initialData?.storagePublicUrl || "",
    // Custom
    storageCustomPostUrl: initialData?.storageCustomPostUrl || "",
    storageCustomFileKey: initialData?.storageCustomFileKey || "",
    storageCustomUrlKey: initialData?.storageCustomUrlKey || "",
  });

  const isConfigured = initialData?.isStorageConfigured || false;
  const provider = form.storageProvider;

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = () => {
    startTransition(async () => {
      const payload = { storageProvider: form.storageProvider };

      if (provider === "S3" || provider === "R2") {
        payload.storageAccessKeyId = form.storageAccessKeyId || null;
        payload.storageSecretKey = form.storageSecretKey || null;
        payload.storageEndpoint = form.storageEndpoint || null;
        payload.storageRegion = form.storageRegion || null;
        payload.storageBucket = form.storageBucket || null;
        payload.storagePublicUrl = form.storagePublicUrl || null;
      } else if (provider === "CUSTOM") {
        payload.storageCustomPostUrl = form.storageCustomPostUrl || null;
        payload.storageCustomFileKey = form.storageCustomFileKey || null;
        payload.storageCustomUrlKey = form.storageCustomUrlKey || null;
      }

      const result = await updateSystemSettings(payload);

      if (result.success) {
        setToast({ type: "success", message: "Storage settings saved successfully!" });
        if (result.data?.storageSecretKey) {
          setForm((p) => ({ ...p, storageSecretKey: result.data.storageSecretKey }));
        }
      } else {
        setToast({ type: "error", message: result.error || "Failed to save" });
      }

      setTimeout(() => setToast(null), 4000);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast & Status */}
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
            ? `Storage is configured using ${PROVIDERS.find((p) => p.id === provider)?.name || provider}.`
            : "Storage is not fully configured. File uploads will use Local storage by default."}
        </div>
      </div>

      {/* ─── Provider Selection ─── */}
      <SettingsCard
        title="Storage Provider"
        description="Choose where uploaded files are stored. Files can be very large (up to 10 GB), so S3/R2 use presigned URLs for direct browser-to-storage uploads."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVIDERS.map((p) => {
            const Icon = p.icon;
            const isActive = provider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => update("storageProvider", p.id)}
                className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                  isActive
                    ? `${p.borderColor} ${p.bgColor} ring-2 ${p.activeRing} ring-offset-1`
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{p.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{p.description}</p>
                </div>
                {isActive && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* ─── S3 / R2 Configuration ─── */}
      {(provider === "S3" || provider === "R2") && (
        <SettingsCard
          title={provider === "S3" ? "AWS S3 Configuration" : "Cloudflare R2 Configuration"}
          description={
            provider === "S3"
              ? "Enter your AWS S3 credentials. Files upload directly from the browser using presigned URLs."
              : "Enter your R2 credentials. R2 uses the S3-compatible API with presigned URLs for direct uploads."
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SettingsInput
              label="Access Key ID *"
              icon={Key}
              value={form.storageAccessKeyId}
              onChange={(e) => update("storageAccessKeyId", e.target.value)}
              placeholder={provider === "R2" ? "R2 Access Key ID" : "AKIA..."}
            />
            <SettingsInput
              label="Secret Access Key *"
              type={showSecret ? "text" : "password"}
              icon={Lock}
              value={form.storageSecretKey}
              onChange={(e) => update("storageSecretKey", e.target.value)}
              placeholder="Your secret key"
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
            {provider === "R2" && (
              <SettingsInput
                label="Endpoint URL *"
                icon={Server}
                value={form.storageEndpoint}
                onChange={(e) => update("storageEndpoint", e.target.value)}
                placeholder="https://<account-id>.r2.cloudflarestorage.com"
              />
            )}
            {provider === "S3" && (
              <SettingsInput
                label="Endpoint URL (Optional)"
                icon={Server}
                value={form.storageEndpoint}
                onChange={(e) => update("storageEndpoint", e.target.value)}
                placeholder="Leave empty for standard AWS S3"
              />
            )}
            <SettingsInput
              label="Region"
              icon={MapPin}
              value={form.storageRegion}
              onChange={(e) => update("storageRegion", e.target.value)}
              placeholder={provider === "R2" ? "auto" : "us-east-1"}
            />
            <SettingsInput
              label="Bucket Name *"
              icon={FolderOpen}
              value={form.storageBucket}
              onChange={(e) => update("storageBucket", e.target.value)}
              placeholder="my-crm-uploads"
            />
            <SettingsInput
              label="Public URL / CDN"
              icon={Link2}
              value={form.storagePublicUrl}
              onChange={(e) => update("storagePublicUrl", e.target.value)}
              placeholder="https://cdn.example.com"
            />
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">How it works</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              When uploading, the server generates a presigned PUT URL. The browser then uploads directly to {provider === "R2" ? "Cloudflare R2" : "AWS S3"} — no file data passes through the server. This supports files up to 5-10 GB efficiently.
              {provider === "R2" && " R2 has zero egress fees, making it cost-effective for serving files."}
            </p>
          </div>

          {provider === "R2" && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">R2 CORS Configuration Required</p>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                Add this CORS rule to your R2 bucket settings to allow direct browser uploads:
              </p>
              <pre className="text-xs bg-slate-900 dark:bg-slate-950 text-emerald-400 p-3 rounded-lg overflow-x-auto">
{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]`}
              </pre>
            </div>
          )}

          {provider === "S3" && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">S3 CORS Configuration Required</p>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                Add this CORS configuration to your S3 bucket to allow direct browser uploads:
              </p>
              <pre className="text-xs bg-slate-900 dark:bg-slate-950 text-emerald-400 p-3 rounded-lg overflow-x-auto">
{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]`}
              </pre>
            </div>
          )}
        </SettingsCard>
      )}

      {/* ─── Custom Provider Configuration ─── */}
      {provider === "CUSTOM" && (
        <SettingsCard
          title="Custom Upload Configuration"
          description="Configure your own file upload endpoint. The system will POST files directly to your URL."
        >
          <div className="grid grid-cols-1 gap-6">
            <SettingsInput
              label="POST URL *"
              icon={Globe}
              value={form.storageCustomPostUrl}
              onChange={(e) => update("storageCustomPostUrl", e.target.value)}
              placeholder="https://your-server.com/api/upload"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingsInput
                label="File Key *"
                icon={Key}
                value={form.storageCustomFileKey}
                onChange={(e) => update("storageCustomFileKey", e.target.value)}
                placeholder="file"
              />
              <SettingsInput
                label="File URL Response Key *"
                icon={Link2}
                value={form.storageCustomUrlKey}
                onChange={(e) => update("storageCustomUrlKey", e.target.value)}
                placeholder="url"
              />
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">How it works</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              The browser will POST the file as <code className="text-emerald-500 bg-slate-900 dark:bg-slate-950 px-1.5 py-0.5 rounded">multipart/form-data</code> to your POST URL.
              The file will be attached with the specified File Key. The system will look for the File URL Response Key in the JSON response to get the file&apos;s URL.
            </p>
          </div>
        </SettingsCard>
      )}

      {/* ─── Local Provider Info ─── */}
      {provider === "LOCAL" && (
        <SettingsCard
          title="Local Storage"
          description="Files are stored on the server's local filesystem."
        >
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">How it works</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are streamed directly to the server and saved in the <code className="text-emerald-500 bg-slate-900 dark:bg-slate-950 px-1.5 py-0.5 rounded">public/uploads</code> directory.
              They&apos;re served via the backend API. This is simplest to set up but limited by server disk space.
              For large files or production use, consider switching to S3 or R2.
            </p>
          </div>
        </SettingsCard>
      )}

      {/* Save Button */}
      <div className="flex justify-end mt-2">
        <SettingsButton
          isPending={isPending}
          onClick={handleSave}
          label="Save Storage Settings"
        />
      </div>
    </div>
  );
}
