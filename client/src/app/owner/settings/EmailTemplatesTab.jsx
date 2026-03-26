"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Save,
  Mail,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Megaphone,
  AlertCircle,
  Check,
  Loader2,
  Eye,
  Code,
  ChevronRight,
  ArrowLeft,
  Info,
} from "lucide-react";
import { getEmailTemplates, updateEmailTemplate } from "@/actions/settings.action";

import SettingsCard from "@/components/settings/SettingsCard";
import SettingsButton from "@/components/settings/SettingsButton";

const TEMPLATE_ICONS = {
  "login-otp": ShieldCheck,
  "welcome-user": UserPlus,
  "reset-password": KeyRound,
  "new-lead": Megaphone,
};

const TEMPLATE_COLORS = {
  "login-otp": { bg: "bg-indigo-50 dark:bg-indigo-900/20", text: "text-indigo-600" },
  "welcome-user": { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600" },
  "reset-password": { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600" },
  "new-lead": { bg: "bg-blue-50", text: "text-blue-600" },
};

export default function EmailTemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editForm, setEditForm] = useState({ subject: "", body: "" });
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState("edit"); // "edit" or "preview"

  // Fetch templates on mount
  useEffect(() => {
    (async () => {
      const data = await getEmailTemplates();
      setTemplates(data || []);
      setLoading(false);
    })();
  }, []);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditForm({ subject: template.subject, body: template.body });
    setViewMode("edit");
    setToast(null);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setToast(null);
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateEmailTemplate(selectedTemplate.id, editForm);
      if (result.success) {
        setToast({ type: "success", message: "Template saved successfully!" });
        // Update local list
        setTemplates((prev) =>
          prev.map((t) => (t.id === selectedTemplate.id ? { ...t, ...editForm } : t))
        );
        setSelectedTemplate((prev) => ({ ...prev, ...editForm }));
      } else {
        setToast({ type: "error", message: result.error || "Failed to save" });
      }
      setTimeout(() => setToast(null), 4000);
    });
  };

  // Parse available variables from template
  const getVariables = (template) => {
    try {
      return JSON.parse(template.variables || "[]");
    } catch {
      return [];
    }
  };

  // Render preview by replacing variables with sample values
  const renderPreview = () => {
    if (!selectedTemplate) return "";
    let html = editForm.body;
    const sampleValues = {
      otpCode: "482916",
      userName: "John",
      siteName: "TaskGo Agency",
      expiryMins: "5",
      otpDigits: "6",
      userEmail: "john@company.com",
      loginUrl: "https://taskgo.agency/login",
      tempPassword: "Welcome@123",
      resetLink: "https://taskgo.agency/reset?token=abc123",
      companyName: "Acme Corp",
      contactName: "Jane Smith",
      leadSource: "Website",
      leadUrl: "https://taskgo.agency/leads/abc123",
    };

    for (const [key, value] of Object.entries(sampleValues)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return html;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ─── Template Detail / Editor ─────────────────────────
  if (selectedTemplate) {
    const variables = getVariables(selectedTemplate);
    const colors = TEMPLATE_COLORS[selectedTemplate.slug] || { bg: "bg-slate-50 dark:bg-slate-900", text: "text-slate-600 dark:text-slate-400" };
    const Icon = TEMPLATE_ICONS[selectedTemplate.slug] || Mail;
    const isEmpty = !editForm.body || editForm.body.trim() === "";

    return (
      <div className="flex flex-col gap-6">
        {/* Toast */}
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

        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm dark:shadow-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedTemplate.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTemplate.description}</p>
            </div>
          </div>
        </div>

        {/* Empty Template Notice */}
        {isEmpty && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 border border-amber-200">
            <Info className="w-5 h-5 shrink-0" />
            This template is empty. Add your HTML email body below to activate it.
          </div>
        )}

        {/* Available Variables */}
        {variables.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Available Variables (use in subject & body)</p>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <span
                  key={v}
                  className="px-2.5 py-1 text-xs font-mono font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => navigator.clipboard?.writeText(`{{${v}}}`)}
                  title="Click to copy"
                >
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Subject */}
        <SettingsCard title="Email Subject">
          <input
            type="text"
            value={editForm.subject}
            onChange={(e) => setEditForm((p) => ({ ...p, subject: e.target.value }))}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400/20 focus:border-indigo-500 transition-all"
            placeholder="Email subject line..."
          />
        </SettingsCard>

        {/* Toggle: Edit / Preview */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none w-fit">
          <button
            onClick={() => setViewMode("edit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "edit"
                ? "bg-slate-900 text-white shadow-sm dark:shadow-none"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <Code className="w-4 h-4" />
            HTML Editor
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === "preview"
                ? "bg-slate-900 text-white shadow-sm dark:shadow-none"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* Body — Editor or Preview */}
        {viewMode === "edit" ? (
          <SettingsCard title="Email Body (HTML)">
            <textarea
              value={editForm.body}
              onChange={(e) => setEditForm((p) => ({ ...p, body: e.target.value }))}
              rows={20}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400/20 focus:border-indigo-500 transition-all resize-y"
              placeholder="Paste your HTML email template here..."
            />
          </SettingsCard>
        ) : (
          <SettingsCard title="Email Preview">
            {isEmpty ? (
              <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
                No template body to preview. Switch to the HTML Editor to add content.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs text-slate-400 ml-2">Email Preview — Sample Data</span>
                </div>
                <iframe
                  srcDoc={renderPreview()}
                  className="w-full border-0"
                  style={{ minHeight: "500px" }}
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </SettingsCard>
        )}

        {/* Save */}
        <div className="flex justify-end mt-2">
          <SettingsButton
            isPending={isPending}
            onClick={handleSave}
            label="Save Template"
          />
        </div>
      </div>
    );
  }

  // ─── Template List ────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Email Templates"
        description="Manage your email templates for automated notifications. Click a template to edit its content and preview it."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            const Icon = TEMPLATE_ICONS[template.slug] || Mail;
            const colors = TEMPLATE_COLORS[template.slug] || { bg: "bg-slate-50 dark:bg-slate-900", text: "text-slate-600 dark:text-slate-400" };
            const isEmpty = !template.body || template.body.trim() === "";

            return (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-indigo-200 hover:shadow-md transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-50 text-sm truncate">
                      {template.name}
                    </h4>
                    {isEmpty && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 rounded-full shrink-0">
                        EMPTY
                      </span>
                    )}
                    {!isEmpty && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 rounded-full shrink-0">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {template.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </SettingsCard>
    </div>
  );
}
