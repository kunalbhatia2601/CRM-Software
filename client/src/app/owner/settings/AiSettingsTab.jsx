"use client";

import { useState, useTransition } from "react";
import {
  BotIcon,
  Key,
  Globe,
  Thermometer,
  Hash,
  Eye,
  EyeOff,
  Check,
  Sparkles,
  Zap,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { updateSystemSettings, listAiModels } from "@/actions/settings.action";

import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";
import Toast from "@/components/ui/Toast";

const PROVIDERS = [
  { value: "NONE", label: "Not Configured" },
  { value: "GEMINI", label: "Google Gemini" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "CUSTOM", label: "Custom (OpenAI-compatible)" },
];

const OTHER_SENTINEL = "__other__";

/**
 * A saved key comes back masked for display. Sending it anywhere is useless at
 * best — the bullets are not valid in an HTTP header — so it is left out and
 * the server falls back to the key it already has.
 */
const isMaskedKey = (key) => !key || /[^\x20-\x7E]/.test(key);

const GEMINI_MODELS = [
  { value: "gemini-3.0-flash", label: "Gemini 3.0 Flash" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: OTHER_SENTINEL, label: "Other..." },
];

const OPENAI_MODELS = [
  { value: "gpt-5-mini", label: "GPT-5 Mini (Recommended)" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "o3-mini", label: "o3 Mini" },
  { value: OTHER_SENTINEL, label: "Other..." },
];

const PROVIDER_CARDS = [
  {
    id: "GEMINI",
    name: "Google Gemini",
    description: "Fast, multimodal AI with generous free tier",
    icon: Sparkles,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-500",
  },
  {
    id: "OPENAI",
    name: "OpenAI",
    description: "GPT-4o and latest models with structured outputs",
    icon: Zap,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-500",
  },
  {
    id: "CUSTOM",
    name: "Custom Provider",
    description: "Any OpenAI-compatible API (Groq, Together, Ollama, etc.)",
    icon: Cpu,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    border: "border-purple-500",
  },
];

// Check if a model value is in the predefined list for a provider
function isKnownModel(provider, model) {
  if (!model) return true;
  const list = provider === "GEMINI" ? GEMINI_MODELS : provider === "OPENAI" ? OPENAI_MODELS : [];
  return list.some((m) => m.value === model && m.value !== OTHER_SENTINEL);
}

export default function AiSettingsTab({ initialData }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const initProvider = initialData?.aiProvider || "NONE";
  const initModel = initialData?.aiModel || "";

  // Auto-detect if current model isn't in the predefined list → show custom input
  const [isCustomModel, setIsCustomModel] = useState(
    () => (initProvider === "GEMINI" || initProvider === "OPENAI") && initModel && !isKnownModel(initProvider, initModel)
  );

  const [form, setForm] = useState({
    aiProvider: initProvider,
    aiApiKey: initialData?.aiApiKey || "",
    aiModel: initModel,
    aiBaseUrl: initialData?.aiBaseUrl || "",
    aiTemperature: initialData?.aiTemperature ?? 0.7,
    aiMaxTokens: initialData?.aiMaxTokens ?? 4096,
  });

  const isConfigured = initialData?.isAiConfigured || false;

  // Live catalogue from the provider, replacing the presets once loaded.
  const [liveModels, setLiveModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleProviderSelect = (providerId) => {
    update("aiProvider", providerId);
    setIsCustomModel(false);
    setLiveModels([]);
    // Set default model when switching provider
    if (providerId === "GEMINI" && !form.aiModel?.startsWith("gemini")) {
      update("aiModel", "gemini-2.0-flash");
    } else if (providerId === "OPENAI" && !form.aiModel?.startsWith("gpt")) {
      update("aiModel", "gpt-4o-mini");
    } else if (providerId === "CUSTOM") {
      update("aiModel", form.aiModel || "");
    }
  };

  const handleModelSelectChange = (e) => {
    const val = e.target.value;
    if (val === OTHER_SENTINEL) {
      setIsCustomModel(true);
      update("aiModel", ""); // clear so user types fresh
    } else {
      setIsCustomModel(false);
      update("aiModel", val);
    }
  };

  /**
   * Ask the provider what it actually offers. Sends the details currently on
   * screen so an unsaved key still works.
   */
  const loadModels = async () => {
    setLoadingModels(true);
    const res = await listAiModels({
      provider: form.aiProvider,
      // Only send a key the user actually typed.
      apiKey: isMaskedKey(form.aiApiKey) ? undefined : form.aiApiKey,
      baseUrl: form.aiBaseUrl || undefined,
    });
    setLoadingModels(false);

    if (!res.success) {
      setLiveModels([]);
      setToast({ type: "error", message: res.error });
      return;
    }

    setLiveModels(res.data.models || []);
    setToast({ type: "success", message: `Loaded ${res.data.count} models from ${res.data.provider}.` });

    // The saved model may not be in the catalogue (renamed or retired) — keep
    // the free-text box in that case rather than silently switching it.
    if (form.aiModel && !(res.data.models || []).some((m) => m.id === form.aiModel)) {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const payload = {
        aiProvider: form.aiProvider,
        aiApiKey: form.aiApiKey || null,
        aiModel: form.aiModel || null,
        aiBaseUrl: form.aiBaseUrl || null,
        aiTemperature: parseFloat(form.aiTemperature) || 0.7,
        aiMaxTokens: parseInt(form.aiMaxTokens) || 4096,
      };

      const result = await updateSystemSettings(payload);
      if (result.success) {
        setToast({ type: "success", message: "AI settings saved successfully" });
        if (result.data?.aiApiKey) setForm((p) => ({ ...p, aiApiKey: result.data.aiApiKey }));
      } else {
        setToast({ type: "error", message: result.error || "Failed to save settings" });
      }
      setTimeout(() => setToast(null), 4000);
    });
  };

  const getModelOptions = () => {
    // A loaded catalogue always beats the built-in presets, which go stale.
    if (liveModels.length > 0) {
      return [
        ...liveModels.map((m) => ({
          value: m.id,
          label: m.label && m.label !== m.id ? `${m.label} — ${m.id}` : m.id,
        })),
        { value: OTHER_SENTINEL, label: "Other..." },
      ];
    }
    if (form.aiProvider === "GEMINI") return GEMINI_MODELS;
    if (form.aiProvider === "OPENAI") return OPENAI_MODELS;
    return [];
  };

  return (
    <div className="flex flex-col gap-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${
          isConfigured
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
        }`}>
          {isConfigured ? <Check className="w-3.5 h-3.5" /> : <BotIcon className="w-3.5 h-3.5" />}
          {isConfigured ? `AI Configured — ${form.aiProvider}` : "AI Not Configured"}
        </div>
      </div>

      {/* Provider Selection Cards */}
      <SettingsCard title="AI Provider" description="Choose your preferred AI provider for content generation, proposals, and intelligent search.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROVIDER_CARDS.map((p) => {
            const Icon = p.icon;
            const selected = form.aiProvider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleProviderSelect(p.id)}
                className={`flex flex-col items-center gap-3 p-2 rounded-2xl border-2 transition-all text-center ${
                  selected
                    ? `${p.border} ${p.bg} shadow-sm`
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.bg}`}>
                  <Icon className={`w-6 h-6 ${p.color}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${selected ? "text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-300"}`}>
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                </div>
                {selected && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${p.bg}`}>
                    <Check className={`w-3 h-3 ${p.color}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Configuration */}
      {form.aiProvider !== "NONE" && (
        <SettingsCard title="Configuration" description="Enter your API credentials and model preferences.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <SettingsInput
              label="API Key"
              icon={Key}
              type={showKey ? "text" : "password"}
              value={form.aiApiKey}
              onChange={(e) => update("aiApiKey", e.target.value)}
              placeholder="Enter your API key"
              rightElement={
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Live catalogue — the presets below go stale as providers ship models. */}
            <div className="flex items-center justify-between gap-3 -mb-2">
              <p className="text-[11px] text-slate-400">
                {liveModels.length > 0
                  ? `Showing ${liveModels.length} models from your ${form.aiProvider} account.`
                  : "Load the live model list from your provider."}
              </p>
              <button
                type="button"
                onClick={loadModels}
                disabled={loadingModels}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingModels ? "animate-spin" : ""}`} />
                {loadingModels ? "Loading…" : liveModels.length > 0 ? "Refresh models" : "Load models"}
              </button>
            </div>

            {form.aiProvider === "CUSTOM" || isCustomModel ? (
              <div className="flex flex-col gap-2">
                {form.aiProvider !== "CUSTOM" && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomModel(false);
                      const defaults = form.aiProvider === "GEMINI" ? "gemini-2.0-flash" : "gpt-4o";
                      update("aiModel", defaults);
                    }}
                    className="self-end text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    ← Back to presets
                  </button>
                )}
                <SettingsInput
                  label="Model Name"
                  icon={BotIcon}
                  value={form.aiModel}
                  onChange={(e) => update("aiModel", e.target.value)}
                  placeholder={form.aiProvider === "GEMINI" ? "e.g. gemini-2.5-pro" : form.aiProvider === "OPENAI" ? "e.g. gpt-4.1-nano" : "e.g. llama-3.1-70b, mixtral-8x7b"}
                />
              </div>
            ) : (
              <SettingsSelect
                label="Model"
                icon={BotIcon}
                value={form.aiModel}
                onChange={handleModelSelectChange}
                options={getModelOptions()}
              />
            )}

            {form.aiProvider === "CUSTOM" && (
              <SettingsInput
                label="Base URL"
                icon={Globe}
                value={form.aiBaseUrl}
                onChange={(e) => update("aiBaseUrl", e.target.value)}
                placeholder="https://api.groq.com/openai/v1"
                className="lg:col-span-2"
              />
            )}

            <SettingsInput
              label="Temperature"
              icon={Thermometer}
              type="number"
              value={form.aiTemperature}
              onChange={(e) => update("aiTemperature", e.target.value)}
              placeholder="0.7"
              min="0"
              max="2"
              step="0.1"
            />

            <SettingsInput
              label="Max Tokens"
              icon={Hash}
              type="number"
              value={form.aiMaxTokens}
              onChange={(e) => update("aiMaxTokens", e.target.value)}
              placeholder="4096"
              min="100"
              max="128000"
            />
          </div>

          {/* Info box */}
          <div className="mt-5 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              <strong>Temperature</strong> controls randomness (0 = deterministic, 2 = very creative).
              <strong> Max Tokens</strong> limits the response length.
              {form.aiProvider === "GEMINI" && " Gemini 2.0 Flash is recommended for the best balance of speed and quality."}
              {form.aiProvider === "OPENAI" && " GPT-4o Mini is recommended for cost-effective structured outputs."}
              {form.aiProvider === "CUSTOM" && " Custom providers must be OpenAI-compatible (same /chat/completions format)."}
            </p>
          </div>
        </SettingsCard>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <SettingsButton
          isPending={isPending}
          onClick={handleSave}
          label="Save AI Settings"
        />
      </div>
    </div>
  );
}
