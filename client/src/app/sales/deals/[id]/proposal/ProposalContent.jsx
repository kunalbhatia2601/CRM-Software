"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  ArrowLeft,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BotIcon,
  Mail,
  X,
  Eye,
} from "lucide-react";

import { aiGenerate } from "@/actions/ai.action";
import { createDocument, sendDocumentEmail } from "@/actions/documents.action";
import { useUpload } from "@/hooks/useUpload";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";

const STEPS = {
  CHOOSE: "CHOOSE",
  AI_INPUT: "AI_INPUT",
  AI_GENERATING: "AI_GENERATING",
  AI_PREVIEW: "AI_PREVIEW",
  UPLOAD: "UPLOAD",
  EMAIL: "EMAIL",
  DONE: "DONE",
};

export default function ProposalContent({ initialDeal, isAiConfigured }) {
  const router = useRouter();
  const { format } = useSite();
  const { upload, uploading, progress, error: uploadError, reset: resetUpload } = useUpload();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const [step, setStep] = useState(STEPS.CHOOSE);
  const [saving, setSaving] = useState(false);
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [createdDocument, setCreatedDocument] = useState(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);

  // Email state
  const [emailTo, setEmailTo] = useState(initialDeal.lead?.email || "");
  const [emailCc, setEmailCc] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const deal = initialDeal;

  // ─── AI Generation Flow ────────────────────────────
  const handleAiGenerate = () => {
    if (!aiInstructions.trim()) {
      showToast("error", "Please provide instructions for the AI");
      return;
    }

    setStep(STEPS.AI_GENERATING);

    startTransition(async () => {
      // Build context from deal data
      const context = {
        dealTitle: deal.title,
        dealValue: deal.value ? Number(deal.value) : null,
        company: deal.lead?.companyName || "",
        contact: deal.lead?.contactName || "",
        email: deal.lead?.email || "",
        phone: deal.lead?.phone || "",
        stage: deal.stage,
        services: (deal.dealServices || []).map((ds) => ({
          name: ds.service?.name,
          price: Number(ds.price),
          quantity: ds.quantity,
          points: ds.service?.points || [],
        })),
        totalValue: (deal.dealServices || []).reduce(
          (sum, ds) => sum + Number(ds.price) * (ds.quantity || 1),
          0
        ),
      };

      const result = await aiGenerate("proposal-generator", aiInstructions, context, true);

      if (result.success) {
        setAiResult(result.data);
        setStep(STEPS.AI_PREVIEW);
      } else {
        showToast("error", result.error || "AI generation failed");
        setStep(STEPS.AI_INPUT);
      }
    });
  };

  // ─── Save AI Proposal as Document ─────────────────
  const handleSaveAiProposal = async () => {
    setSaving(true);
    try {
      // Create an HTML document from the AI result
      const proposalHtml = buildProposalHtml(aiResult, deal);

      // Sanitise filename — strip non-ASCII chars and special characters for HTTP header safety
      const safeName = deal.title
        .replace(/[^\w\s-]/g, "")       // remove non-word chars (includes em dashes, etc.)
        .replace(/\s+/g, "-")           // spaces → hyphens
        .replace(/-+/g, "-")            // collapse multiple hyphens
        .substring(0, 80)               // limit length
        || "Proposal";

      // Upload the HTML as a blob to storage
      const blob = new Blob([proposalHtml], { type: "text/html" });
      const file = new File([blob], `${safeName}-Proposal.html`, {
        type: "text/html",
      });

      const uploadResult = await upload(file);

      if (!uploadResult) {
        // uploadError state may not have updated yet, so read it after a tick
        showToast("error", "Failed to upload proposal. Please try again.");
        return;
      }

      // Create document record
      const docResult = await createDocument({
        name: aiResult.title || `${deal.title} — Proposal`,
        type: "PROPOSAL",
        fileUrl: uploadResult.fileUrl,
        fileKey: uploadResult.key,
        mimeType: "text/html",
        fileSize: blob.size,
        description: stringify(aiResult.executiveSummary) || null,
        isAiGenerated: true,
        dealId: deal.id,
        clientId: deal.client?.id || null,
        projectId: deal.project?.id || null,
      });

      if (docResult.success) {
        setCreatedDocument(docResult.data);
        setStep(STEPS.EMAIL);
        showToast("success", "Proposal saved successfully!");
      } else {
        showToast("error", docResult.error || "Failed to save proposal");
      }
    } catch (err) {
      console.error("[ProposalContent] Save failed:", err);
      showToast("error", err.message || "Failed to save proposal");
    } finally {
      setSaving(false);
    }
  };

  // ─── Manual Upload Flow ───────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUploadProposal = async () => {
    if (!selectedFile) {
      showToast("error", "Please select a file");
      return;
    }

    setSaving(true);
    try {
      const uploadResult = await upload(selectedFile);

      if (!uploadResult) {
        showToast("error", "Upload failed. Please try again.");
        return;
      }

      const docResult = await createDocument({
        name: selectedFile.name.replace(/\.[^/.]+$/, "") || `${deal.title} — Proposal`,
        type: "PROPOSAL",
        fileUrl: uploadResult.fileUrl,
        fileKey: uploadResult.key,
        mimeType: selectedFile.type || null,
        fileSize: selectedFile.size || null,
        isAiGenerated: false,
        dealId: deal.id,
        clientId: deal.client?.id || null,
        projectId: deal.project?.id || null,
      });

      if (docResult.success) {
        setCreatedDocument(docResult.data);
        setStep(STEPS.EMAIL);
        showToast("success", "Proposal uploaded successfully!");
      } else {
        showToast("error", docResult.error || "Failed to save document");
      }
    } catch (err) {
      console.error("[ProposalContent] Upload failed:", err);
      showToast("error", err.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Send Email ────────────────────────────────────
  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      showToast("error", "Recipient email is required");
      return;
    }
    if (!createdDocument) {
      showToast("error", "No document to send");
      return;
    }

    setSendingEmail(true);
    const result = await sendDocumentEmail(createdDocument.id, {
      to: emailTo.trim(),
      cc: emailCc.trim() || null,
      message: emailMessage.trim() || null,
    });
    setSendingEmail(false);

    if (result.success) {
      showToast("success", "Proposal sent via email!");
      setStep(STEPS.DONE);
    } else {
      showToast("error", result.error || "Failed to send email");
    }
  };

  const handleSkipEmail = () => {
    setStep(STEPS.DONE);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Create Proposal"
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Deals", href: "/sales/deals" },
          { label: deal.title, href: `/sales/deals/${deal.id}` },
          { label: "Proposal" },
        ]}
      />

      {/* Deal Context Bar */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-5 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
              {deal.title?.[0]?.toUpperCase() || "D"}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{deal.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {deal.lead?.companyName} {deal.lead?.contactName && `· ${deal.lead.contactName}`}
              </p>
            </div>
          </div>
          {deal.value && (
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
              {format(Number(deal.value), { decimals: 0 })}
            </span>
          )}
        </div>
      </div>

      {/* ─── STEP: Choose Method ─── */}
      {step === STEPS.CHOOSE && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Option */}
          <button
            onClick={() => {
              if (isAiConfigured) {
                setStep(STEPS.AI_INPUT);
              } else {
                showToast("error", "AI is not configured. Please set it up in Settings → AI Settings.");
              }
            }}
            className={`group flex flex-col items-center gap-4 p-8 rounded-[24px] border-2 transition-all text-center ${
              isAiConfigured
                ? "border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                : "border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Create with AI</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isAiConfigured
                  ? "Provide instructions and let AI generate a professional proposal"
                  : "AI is not configured — set it up in Settings first"}
              </p>
            </div>
            {isAiConfigured && (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
                Recommended
              </span>
            )}
          </button>

          {/* Manual Upload */}
          <button
            onClick={() => setStep(STEPS.UPLOAD)}
            className="group flex flex-col items-center gap-4 p-8 rounded-[24px] border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-center cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Upload Manually</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload your own proposal document (PDF, DOCX, etc.)
              </p>
            </div>
          </button>
        </div>
      )}

      {/* ─── STEP: AI Instructions ─── */}
      {step === STEPS.AI_INPUT && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <BotIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">AI Proposal Generator</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Provide instructions for the AI. It already knows your deal details, services, and pricing.
              </p>
            </div>
          </div>

          <textarea
            value={aiInstructions}
            onChange={(e) => setAiInstructions(e.target.value)}
            rows={6}
            placeholder="e.g., Create a detailed proposal highlighting our web development services. Emphasize our 5-year track record, offer a 10% early-bird discount, and set a 30-day validity period. Keep the tone professional but friendly..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[14px] text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-y"
            autoFocus
          />

          {/* Info box about context */}
          <div className="mt-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              <strong>AI knows:</strong> Deal title, value, company, contact details, all services with pricing, and total value.
              Your instructions guide the AI on tone, structure, and special offers.
            </p>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(STEPS.CHOOSE)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleAiGenerate}
              disabled={isPending || !aiInstructions.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Generate Proposal
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: AI Generating ─── */}
      {step === STEPS.AI_GENERATING && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-12 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center animate-pulse">
            <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Generating Proposal...</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
            AI is crafting your proposal based on the deal details and your instructions. This may take a moment.
          </p>
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mt-2" />
        </div>
      )}

      {/* ─── STEP: AI Preview ─── */}
      {step === STEPS.AI_PREVIEW && aiResult && (
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Proposal Generated</h3>
                  <p className="text-xs text-slate-400">Review the proposal below before saving</p>
                </div>
              </div>
            </div>

            {/* Proposal Preview */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{stringify(aiResult.title) || "Proposal"}</h2>
              </div>
              <div className="p-6 space-y-6">
                {aiResult.executiveSummary && (
                  <ProposalSection title="Executive Summary" content={aiResult.executiveSummary} />
                )}
                {aiResult.scopeOfWork && (
                  <ProposalSection title="Scope of Work" content={aiResult.scopeOfWork} />
                )}
                {aiResult.timeline && (
                  <ProposalSection title="Timeline" content={aiResult.timeline} />
                )}
                {aiResult.pricing && (
                  <ProposalSection title="Pricing" content={aiResult.pricing} />
                )}
                {aiResult.terms && (
                  <ProposalSection title="Terms & Conditions" content={aiResult.terms} />
                )}
                {aiResult.conclusion && (
                  <ProposalSection title="Conclusion" content={aiResult.conclusion} />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => { setStep(STEPS.AI_INPUT); setAiResult(null); }}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={handleSaveAiProposal}
              disabled={saving || uploading}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Save Proposal
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: Manual Upload ─── */}
      {step === STEPS.UPLOAD && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Upload Proposal</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload your proposal document. Supported formats: PDF, DOCX, DOC, HTML, TXT.
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all cursor-pointer">
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.html,.txt,.pptx,.xlsx"
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-300" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Click to browse or drag and drop your file
                </p>
              </div>
            )}
          </label>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Uploading...</span>
                <span className="text-xs font-medium text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              {uploadError}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => { setStep(STEPS.CHOOSE); setSelectedFile(null); resetUpload(); }}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleUploadProposal}
              disabled={saving || uploading || !selectedFile}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload & Save
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: Send Email ─── */}
      {step === STEPS.EMAIL && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Send Proposal via Email</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Send the proposal to the client. You can add a CC for yourself.
              </p>
            </div>
          </div>

          {/* Saved doc info */}
          {createdDocument && (
            <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{createdDocument.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Version {createdDocument.version} · {createdDocument.isAiGenerated ? "AI Generated" : "Uploaded"}
                </p>
              </div>
              {createdDocument.fileUrl && (
                <a
                  href={createdDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </a>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">To (Client Email)</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="client@company.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">CC (Your Email — Optional)</label>
              <input
                type="email"
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">Message (Optional)</label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
                placeholder="Add a personal message to the client..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handleSkipEmail}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Skip — Don't Send
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || !emailTo.trim()}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Proposal
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP: Done ─── */}
      {step === STEPS.DONE && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-12 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Proposal Created!</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
            Your proposal has been saved to the deal. You can view it in the deal details page.
          </p>
          <div className="flex gap-3 mt-3">
            <Link
              href={`/sales/deals/${deal.id}`}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Deal
            </Link>
            {createdDocument?.fileUrl && (
              <a
                href={createdDocument.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Proposal
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Safely convert any value to a renderable string.
 * Handles: strings, numbers, arrays, objects, null/undefined.
 */
function stringify(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => stringify(item)).join("\n");
  }
  if (typeof value === "object") {
    // Attempt a readable format: each key-value on its own line
    return Object.entries(value)
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        return `${label}: ${stringify(v)}`;
      })
      .join("\n");
  }
  return String(value);
}

/**
 * Render a proposal section. Handles string, array, or object content.
 */
function ProposalSection({ title, content }) {
  const text = stringify(content);
  if (!text) return null;
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-2 uppercase tracking-wider">{title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}

/**
 * Build an HTML document from AI-generated proposal data.
 */
function buildProposalHtml(data, deal) {
  const sections = [];

  if (data.executiveSummary) {
    sections.push(`<h2 style="color:#1e293b;font-size:18px;margin:24px 0 12px;">Executive Summary</h2><p style="color:#475569;line-height:1.7;white-space:pre-wrap;">${escHtml(stringify(data.executiveSummary))}</p>`);
  }
  if (data.scopeOfWork) {
    sections.push(`<h2 style="color:#1e293b;font-size:18px;margin:24px 0 12px;">Scope of Work</h2><p style="color:#475569;line-height:1.7;white-space:pre-wrap;">${escHtml(stringify(data.scopeOfWork))}</p>`);
  }
  if (data.timeline) {
    sections.push(`<h2 style="color:#1e293b;font-size:18px;margin:24px 0 12px;">Timeline</h2><p style="color:#475569;line-height:1.7;white-space:pre-wrap;">${escHtml(stringify(data.timeline))}</p>`);
  }
  if (data.pricing) {
    sections.push(`<h2 style="color:#1e293b;font-size:18px;margin:24px 0 12px;">Pricing</h2><p style="color:#475569;line-height:1.7;white-space:pre-wrap;">${escHtml(stringify(data.pricing))}</p>`);
  }
  if (data.terms) {
    sections.push(`<h2 style="color:#1e293b;font-size:18px;margin:24px 0 12px;">Terms & Conditions</h2><p style="color:#475569;line-height:1.7;white-space:pre-wrap;">${escHtml(stringify(data.terms))}</p>`);
  }
  if (data.conclusion) {
    sections.push(`<h2 style="color:#1e293b;font-size:18px;margin:24px 0 12px;">Conclusion</h2><p style="color:#475569;line-height:1.7;white-space:pre-wrap;">${escHtml(stringify(data.conclusion))}</p>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title || "Proposal")}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;color:#1e293b;">
  <div style="background:linear-gradient(135deg,#5542F6 0%,#7C3AED 100%);border-radius:16px;padding:40px;margin-bottom:32px;">
    <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">${escHtml(data.title || "Proposal")}</h1>
    <p style="color:rgba(255,255,255,0.8);margin:12px 0 0;font-size:16px;">Prepared for ${escHtml(deal.lead?.companyName || "Client")}</p>
    <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>
  ${sections.join("\n  <hr style=\"border:none;border-top:1px solid #e2e8f0;margin:20px 0;\">")}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
  <p style="color:#94a3b8;font-size:12px;text-align:center;">This proposal was generated for ${escHtml(deal.title)}.</p>
</body>
</html>`;
}

function escHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
