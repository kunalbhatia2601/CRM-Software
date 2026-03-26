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
} from "lucide-react";

import { updateDealStage } from "@/actions/deals.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function ConvertDealContent({ initialDeal, accountManagers, availableServices }) {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

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

      const result = await updateDealStage(
        deal.id,
        "WON",
        null,
        form.accountManagerId || null,
        projectConfig
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
    <div className="flex flex-col gap-6 w-full max-w-4xl">
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
      <div className="rounded-[24px] border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-200">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Winning This Deal</h3>
            <p className="text-sm text-slate-500">
              Review and configure the project details before finalizing
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Lead</span>
            <p className="font-semibold text-slate-800">{deal.lead?.companyName || "—"}</p>
          </div>
          <div>
            <span className="text-slate-400">Contact</span>
            <p className="font-semibold text-slate-800">{deal.lead?.contactName || "—"}</p>
          </div>
          <div>
            <span className="text-slate-400">Deal Value</span>
            <p className="font-semibold text-slate-800">
              {deal.value ? format(Number(deal.value)) : "—"}
            </p>
          </div>
          <div>
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
            <label className="text-sm font-semibold text-slate-800 mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the project scope and goals..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none"
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
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="col-span-4">
                    <p className="font-semibold text-slate-800 text-sm">{svc.name}</p>
                    {priceChanged && (
                      <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-0.5">
                        <Pencil className="h-3 w-3" /> Price adjusted
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-sm ${priceChanged ? "line-through text-slate-400" : "text-slate-600"}`}>
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
                      className="w-full text-right px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={svc.quantity}
                      onChange={(e) => handleServiceQuantityChange(svc.serviceId, e.target.value)}
                      min="1"
                      className="w-full text-center px-2 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2 text-right font-semibold text-sm text-slate-800">
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
            <div className="flex items-center justify-between px-4 pt-4 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Services Total</span>
              <span className="text-lg font-bold text-slate-900">
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

      {/* ─── Notes ─── */}
      <SettingsCard
        title="Notes"
        description="Additional context or instructions for the project."
      >
        <div>
          <label className="text-sm font-semibold text-slate-800 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Key requirements, milestones, or any context about this project..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none"
          />
        </div>
      </SettingsCard>

      {/* ─── Action Buttons ─── */}
      <div className="flex items-center justify-between mt-2 pb-8">
        <button
          onClick={() => router.push(`/owner/deals/${deal.id}`)}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
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
