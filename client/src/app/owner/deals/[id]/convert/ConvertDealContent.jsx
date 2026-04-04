"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  FileText,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
  RefreshCw,
  Trophy,
  Package,
  Plus,
  X,
  ArrowRight,
  AlertCircle,
  Pencil,
  Check,
  Upload,
  Sparkles,
  ShieldCheck,
  FileSignature,
  Trash2,
  Loader2,
  Eye,
} from "lucide-react";

import { updateDealStage } from "@/actions/deals.action";
import { aiGenerate } from "@/actions/ai.action";
import { useUpload } from "@/hooks/useUpload";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function ConvertDealContent({ initialDeal, accountManagers, availableServices, aiEnabled }) {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const { upload, uploading, progress } = useUpload();

  const deal = initialDeal;

  // Build initial services from deal's existing dealServices
  const initialServices = (deal.dealServices || []).map((ds) => ({
    serviceId: ds.serviceId || ds.service?.id,
    name: ds.service?.name || "Unknown Service",
    quantity: ds.quantity || 1,
    price: Number(ds.price || 0),
    originalPrice: Number(ds.originalPrice || ds.price || 0),
  }));

  const [services, setServices] = useState(initialServices);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // Project config form
  const [form, setForm] = useState({
    name: deal.title || "",
    description: "",
    budget: deal.value ? String(deal.value) : "",
    startDate: "",
    endDate: "",
    billingCycle: "ONE_TIME",
    nextBillingDate: "",
    accountManagerId: "",
    notes: "",
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  // ─── Documents State ───
  const [conversionDocs, setConversionDocs] = useState([]); // { id, name, type, fileUrl, fileKey, mimeType, fileSize, requiresSignature, isAiGenerated, preview }
  const [generatingDoc, setGeneratingDoc] = useState(null); // "AGREEMENT" | "NDA" | null
  const [previewDoc, setPreviewDoc] = useState(null); // doc to preview

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await upload(file);
    if (result) {
      setConversionDocs((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          type: docType,
          fileUrl: result.fileUrl,
          fileKey: result.key || null,
          mimeType: file.type,
          fileSize: file.size,
          requiresSignature: true,
          isAiGenerated: false,
          preview: null,
        },
      ]);
      showToast("success", `${docType === "NDA" ? "NDA" : "Agreement"} uploaded successfully`);
    } else {
      showToast("error", "Upload failed. Please try again.");
    }
    e.target.value = "";
  };

  const handleAiGenerate = async (docType) => {
    setGeneratingDoc(docType);
    try {
      const context = {
        documentType: docType === "NDA" ? "Non-Disclosure Agreement" : "Service Agreement",
        clientCompany: deal.lead?.companyName || "",
        clientContact: deal.lead?.contactName || "",
        projectName: form.name || deal.title,
        dealValue: deal.value ? Number(deal.value) : null,
        services: services.map((s) => ({ name: s.name, price: s.price, quantity: s.quantity })),
      };

      const result = await aiGenerate(
        "agreement-generator",
        `Generate a professional ${docType === "NDA" ? "Non-Disclosure Agreement (NDA)" : "Service Agreement"} for the project "${form.name || deal.title}" with client "${deal.lead?.companyName}".`,
        context,
        true
      );

      if (result.success && result.data) {
        const genTitle = result.data.title || (docType === "NDA" ? "Non-Disclosure Agreement" : "Service Agreement");
        const genContent = result.data.content || result.data.raw || "";

        // Store generated content as a markdown blob for uploading
        const blob = new Blob([genContent], { type: "text/markdown" });
        const file = new File([blob], `${genTitle.replace(/\s+/g, "_")}.md`, { type: "text/markdown" });
        const uploadResult = await upload(file);

        if (uploadResult) {
          setConversionDocs((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              name: genTitle,
              type: docType,
              fileUrl: uploadResult.fileUrl,
              fileKey: uploadResult.key || null,
              mimeType: "text/markdown",
              fileSize: blob.size,
              requiresSignature: true,
              isAiGenerated: true,
              preview: genContent,
            },
          ]);
          showToast("success", `${docType === "NDA" ? "NDA" : "Agreement"} generated and uploaded`);
        } else {
          showToast("error", "AI generated the document but upload failed.");
        }
      } else {
        showToast("error", result.error || "AI generation failed. Check AI settings.");
      }
    } catch {
      showToast("error", "AI generation failed. Please check your AI configuration in Settings.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleRemoveDoc = (docId) => {
    setConversionDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleToggleSignature = (docId) => {
    setConversionDocs((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, requiresSignature: !d.requiresSignature } : d
      )
    );
  };

  const handleDocNameChange = (docId, newName) => {
    setConversionDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, name: newName } : d))
    );
  };

  // Calculate total from services
  const servicesTotal = useMemo(() => {
    return services.reduce((sum, s) => sum + s.price * s.quantity, 0);
  }, [services]);

  // Suggest budget from services total
  const suggestBudget = () => {
    update("budget", String(servicesTotal));
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Service Management ───
  const handleAddService = () => {
    if (!selectedServiceId) return;

    // Check if already added
    if (services.find((s) => s.serviceId === selectedServiceId)) {
      showToast("error", "Service already added");
      return;
    }

    const svc = availableServices.find((s) => s.id === selectedServiceId);
    if (!svc) return;

    const effectivePrice = Number(svc.salePrice ?? svc.price);
    setServices((prev) => [
      ...prev,
      {
        serviceId: svc.id,
        name: svc.name,
        quantity: 1,
        price: effectivePrice,
        originalPrice: effectivePrice,
      },
    ]);
    setSelectedServiceId("");
  };

  const handleRemoveService = (serviceId) => {
    setServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  const handleServicePriceChange = (serviceId, newPrice) => {
    setServices((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId ? { ...s, price: Number(newPrice) || 0 } : s
      )
    );
  };

  const handleServiceQuantityChange = (serviceId, newQty) => {
    setServices((prev) =>
      prev.map((s) =>
        s.serviceId === serviceId ? { ...s, quantity: Math.max(1, parseInt(newQty) || 1) } : s
      )
    );
  };

  // ─── Submit Conversion ───
  const handleConvert = () => {
    if (!form.name.trim()) {
      showToast("error", "Project name is required");
      return;
    }

    startTransition(async () => {
      const projectConfig = {
        name: form.name.trim(),
      };

      if (form.description.trim()) projectConfig.description = form.description.trim();
      if (form.budget) projectConfig.budget = parseFloat(form.budget);
      if (form.startDate) projectConfig.startDate = form.startDate;
      if (form.endDate) projectConfig.endDate = form.endDate;
      if (form.billingCycle) projectConfig.billingCycle = form.billingCycle;
      if (form.billingCycle !== "ONE_TIME" && form.nextBillingDate) {
        projectConfig.nextBillingDate = form.nextBillingDate;
      }
      if (form.notes.trim()) projectConfig.notes = form.notes.trim();

      // Services with pricing
      if (services.length > 0) {
        projectConfig.services = services.map((s) => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
          price: s.price,
          originalPrice: s.originalPrice,
        }));
      }

      // Prepare documents for API
      const documentsPayload = conversionDocs.map((d) => ({
        name: d.name,
        type: d.type,
        fileUrl: d.fileUrl,
        fileKey: d.fileKey,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        isAiGenerated: d.isAiGenerated,
        requiresSignature: d.requiresSignature,
      }));

      const result = await updateDealStage(
        deal.id,
        "WON",
        null,
        form.accountManagerId || null,
        projectConfig,
        documentsPayload
      );

      if (result.success) {
        const projectId = result.data?.project?.id;
        if (projectId) {
          router.push(`/owner/projects/${projectId}`);
        } else {
          router.push(`/owner/deals/${deal.id}`);
        }
      } else {
        showToast("error", result.error || "Failed to convert deal");
      }
    });
  };

  // Filter out already-added services from dropdown
  const addableServices = availableServices.filter(
    (s) => !services.find((added) => added.serviceId === s.id)
  );

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Convert Deal to Project"
        description={`Finalize "${deal.title}" and create a project with client account.`}
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Deals", href: "/owner/deals" },
          { label: deal.title, href: `/owner/deals/${deal.id}` },
          { label: "Convert" },
        ]}
      />

      {/* ─── Deal Summary Banner ─── */}
      <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm shadow-slate-200/50 dark:shadow-none dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-200">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Winning This Deal</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Review and configure the project details before finalizing
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Lead</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{deal.lead?.companyName || "—"}</p>
          </div>
          <div>
            <span className="text-slate-400">Contact</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{deal.lead?.contactName || "—"}</p>
          </div>
          <div>
            <span className="text-slate-400">Deal Value</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {deal.value ? format(Number(deal.value)) : "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Stage</span>
            <Badge value={deal.stage} />
          </div>
        </div>
      </div>

      {/* ─── Project Info ─── */}
      <SettingsCard title="Project Info" description="Name and description for the new project.">
        <div className="grid grid-cols-1 gap-6">
          <SettingsInput
            label="Project Name *"
            icon={FolderKanban}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Website Redesign"
          />
          <div>
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the project scope and goals..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
            />
          </div>
        </div>
      </SettingsCard>

      {/* ─── Services ─── */}
      <SettingsCard
        title="Services"
        description="Review, add, or remove services. You can adjust the snapshot price for this project."
      >
        {/* Add service row */}
        <div className="flex items-end gap-3 mb-6">
          <div className="flex-1">
            <SettingsSelect
              label="Add a Service"
              icon={Package}
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              options={[
                { value: "", label: "— Select Service —" },
                ...addableServices.map((s) => ({
                  value: s.id,
                  label: `${s.name} — ${format(Number(s.salePrice ?? s.price))}`,
                })),
              ]}
            />
          </div>
          <button
            onClick={handleAddService}
            disabled={!selectedServiceId}
            className="h-[52px] px-5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        {/* Services list */}
        {services.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No services added yet. Add services above to include them in the project.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Service</div>
              <div className="col-span-2 text-right">Original Price</div>
              <div className="col-span-2 text-right">Snapshot Price</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1" />
            </div>

            {services.map((svc) => {
              const priceChanged = svc.price !== svc.originalPrice;
              return (
                <div
                  key={svc.serviceId}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-colors"
                >
                  <div className="col-span-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{svc.name}</p>
                    {priceChanged && (
                      <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                        <Pencil className="h-3 w-3" /> Price adjusted
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-sm ${priceChanged ? "line-through text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                      {format(svc.originalPrice)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={svc.price}
                      onChange={(e) => handleServicePriceChange(svc.serviceId, e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full text-right px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={svc.quantity}
                      onChange={(e) => handleServiceQuantityChange(svc.serviceId, e.target.value)}
                      min="1"
                      className="w-full text-center px-2 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2 text-right font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {format(svc.price * svc.quantity)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => handleRemoveService(svc.serviceId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="flex items-center justify-between px-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Services Total</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {format(servicesTotal)}
              </span>
            </div>
          </div>
        )}
      </SettingsCard>

      {/* ─── Timeline & Budget ─── */}
      <SettingsCard
        title="Timeline & Budget"
        description="Set the project schedule and budget."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SettingsInput
            label="Start Date"
            type="date"
            icon={Calendar}
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
          <SettingsInput
            label="End Date"
            type="date"
            icon={Calendar}
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
          />
          <div>
            <SettingsInput
              label="Budget"
              type="number"
              icon={DollarSign}
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="50000"
            />
            {services.length > 0 && String(form.budget) !== String(servicesTotal) && (
              <button
                onClick={suggestBudget}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                <ArrowRight className="h-3 w-3" />
                Set to services total ({format(servicesTotal)})
              </button>
            )}
          </div>
        </div>
      </SettingsCard>

      {/* ─── Billing Cycle ─── */}
      <SettingsCard
        title="Billing Cycle"
        description="Set whether this project recurs on a schedule."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSelect
            label="Billing Cycle"
            icon={RefreshCw}
            value={form.billingCycle}
            onChange={(e) => update("billingCycle", e.target.value)}
            options={[
              { value: "ONE_TIME", label: "One Time" },
              { value: "MONTHLY", label: "Monthly" },
              { value: "QUARTERLY", label: "Quarterly (3 months)" },
              { value: "SEMI_ANNUAL", label: "Semi Annual (6 months)" },
              { value: "ANNUAL", label: "Annual (12 months)" },
            ]}
          />
          {form.billingCycle !== "ONE_TIME" && (
            <SettingsInput
              label="Next Billing Date"
              type="date"
              icon={Calendar}
              value={form.nextBillingDate}
              onChange={(e) => update("nextBillingDate", e.target.value)}
            />
          )}
        </div>
        {form.billingCycle !== "ONE_TIME" && (
          <p className="text-xs text-slate-400 mt-2">
            Leave next billing date empty to auto-calculate from the start date.
          </p>
        )}
      </SettingsCard>

      {/* ─── Account Manager ─── */}
      <SettingsCard
        title="Account Manager"
        description="Assign an account manager for the client and project."
      >
        <SettingsSelect
          label="Account Manager"
          icon={UserCheck}
          value={form.accountManagerId}
          onChange={(e) => update("accountManagerId", e.target.value)}
          options={[
            { value: "", label: "— Unassigned —" },
            ...accountManagers.map((u) => ({
              value: u.id,
              label: `${u.name} (${u.role.replace(/_/g, " ")})`,
            })),
          ]}
        />
      </SettingsCard>

      {/* ─── Conversion Documents (Agreements / NDAs) ─── */}
      <SettingsCard
        title="Agreements & Documents"
        description="Upload or AI-generate agreements, NDAs, and other documents. Mark which ones require client signature."
      >
        {/* Add document actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Upload Agreement */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
            <Upload className="h-4 w-4" />
            Upload Agreement
            <input
              type="file"
              accept=".pdf,.doc,.docx,.md,.txt"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "AGREEMENT")}
              disabled={uploading}
            />
          </label>

          {/* Upload NDA */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
            <Upload className="h-4 w-4" />
            Upload NDA
            <input
              type="file"
              accept=".pdf,.doc,.docx,.md,.txt"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "NDA")}
              disabled={uploading}
            />
          </label>

          {/* Upload Other */}
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors text-sm font-medium text-slate-700 dark:text-slate-300">
            <Upload className="h-4 w-4" />
            Upload Other
            <input
              type="file"
              accept=".pdf,.doc,.docx,.md,.txt,.xlsx,.csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "OTHER")}
              disabled={uploading}
            />
          </label>

          {/* AI Generate buttons — only show if AI is configured */}
          {aiEnabled && (
            <>
              <button
                onClick={() => handleAiGenerate("AGREEMENT")}
                disabled={generatingDoc !== null || uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {generatingDoc === "AGREEMENT" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Generate Agreement
              </button>
              <button
                onClick={() => handleAiGenerate("NDA")}
                disabled={generatingDoc !== null || uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {generatingDoc === "NDA" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI Generate NDA
              </button>
            </>
          )}
        </div>

        {/* Upload progress */}
        {uploading && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Documents list */}
        {conversionDocs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No documents added yet. Upload or AI-generate agreements, NDAs, or other relevant documents.
          </div>
        ) : (
          <div className="space-y-3">
            {conversionDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              >
                {/* Icon */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  doc.type === "NDA"
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                    : doc.type === "AGREEMENT"
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}>
                  <FileSignature className="h-5 w-5" />
                </div>

                {/* Name + Meta */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={doc.name}
                    onChange={(e) => handleDocNameChange(doc.id, e.target.value)}
                    className="w-full text-sm font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none focus:ring-0 p-0"
                    placeholder="Document name"
                  />
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge value={doc.type} />
                    {doc.isAiGenerated && (
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> AI Generated
                      </span>
                    )}
                    {doc.fileSize && (
                      <span className="text-[11px] text-slate-400">
                        {(doc.fileSize / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                </div>

                {/* To Be Signed Toggle */}
                <button
                  onClick={() => handleToggleSignature(doc.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                    doc.requiresSignature
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                  }`}
                  title={doc.requiresSignature ? "Client signature required" : "No signature required"}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {doc.requiresSignature ? "To Be Signed" : "No Signature"}
                </button>

                {/* Preview (for AI docs) */}
                {doc.preview && (
                  <button
                    onClick={() => setPreviewDoc(previewDoc?.id === doc.id ? null : doc)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors shrink-0"
                    title="Preview document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}

                {/* Remove */}
                <button
                  onClick={() => handleRemoveDoc(doc.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Preview panel */}
        {previewDoc && (
          <div className="mt-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Preview: {previewDoc.name}
              </h4>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg bg-white dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {previewDoc.preview}
            </div>
          </div>
        )}

        {/* Info callout */}
        {conversionDocs.some((d) => d.requiresSignature) && (
          <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Documents marked <strong>"To Be Signed"</strong> will set the project status to <strong>Due Signing</strong>.
              The client will see these documents in their portal and must sign them before the project proceeds.
            </p>
          </div>
        )}
      </SettingsCard>

      {/* ─── Notes ─── */}
      <SettingsCard
        title="Notes"
        description="Additional context or instructions for the project."
      >
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Key requirements, milestones, or any context about this project..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
          />
        </div>
      </SettingsCard>

      {/* ─── Action Buttons ─── */}
      <div className="flex items-center justify-between mt-2 pb-8">
        <button
          onClick={() => router.push(`/owner/deals/${deal.id}`)}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <SettingsButton
          isPending={isPending}
          onClick={handleConvert}
          label="Convert to Project"
        />
      </div>
    </div>
  );
}
