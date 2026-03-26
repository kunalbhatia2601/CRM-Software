"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderKanban,
  FileText,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
  RefreshCw,
  Package,
  Plus,
  X,
  ArrowRight,
  Pencil,
} from "lucide-react";

import {
  createProject,
  getProjectAccountManagers,
  getProjectClients,
} from "@/actions/projects.action";
import { getServicesDropdown } from "@/actions/services.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function CreateProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [managers, setManagers] = useState([]);
  const [clients, setClients] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // Services state
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    clientId: "",
    startDate: "",
    endDate: "",
    budget: "",
    notes: "",
    accountManagerId: "",
    billingCycle: "ONE_TIME",
    nextBillingDate: "",
  });

  useEffect(() => {
    getProjectAccountManagers().then(setManagers);
    getProjectClients().then(setClients);
    getServicesDropdown().then(setAvailableServices);

    const clientId = searchParams.get("clientId");
    if (clientId) {
      setForm((prev) => ({ ...prev, clientId }));
    }
  }, [searchParams]);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Service helpers ───
  const servicesTotal = useMemo(() => {
    return services.reduce((sum, s) => sum + s.price * s.quantity, 0);
  }, [services]);

  const suggestBudget = () => {
    update("budget", String(servicesTotal));
  };

  const handleAddService = () => {
    if (!selectedServiceId) return;
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

  const addableServices = availableServices.filter(
    (s) => !services.find((added) => added.serviceId === s.id)
  );

  // ─── Submit ───
  const handleSubmit = () => {
    if (!form.name.trim()) {
      showToast("error", "Project name is required");
      return;
    }

    if (!form.clientId) {
      showToast("error", "Please select a client");
      return;
    }

    startTransition(async () => {
      const payload = { ...form };
      if (payload.budget) payload.budget = parseFloat(payload.budget);
      else delete payload.budget;
      if (!payload.description) delete payload.description;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      if (!payload.notes) delete payload.notes;
      if (!payload.accountManagerId) delete payload.accountManagerId;
      if (!payload.billingCycle || payload.billingCycle === "ONE_TIME") {
        payload.billingCycle = "ONE_TIME";
        delete payload.nextBillingDate;
      }
      if (!payload.nextBillingDate) delete payload.nextBillingDate;

      // Attach services
      if (services.length > 0) {
        payload.services = services.map((s) => ({
          serviceId: s.serviceId,
          quantity: s.quantity,
          price: s.price,
          originalPrice: s.originalPrice,
        }));
      }

      const result = await createProject(payload);
      if (result.success) {
        router.push(`/owner/projects/${result.data.id}`);
      } else {
        showToast("error", result.error || "Failed to create project");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="New Project"
        description="Create a new project under a client."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Projects", href: "/owner/projects" },
          { label: "New Project" },
        ]}
      />

      <SettingsCard
        title="Project Info"
        description="Basic project details."
      >
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

      <SettingsCard
        title="Client & Assignment"
        description="Assign this project to a client and account manager."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSelect
            label="Client *"
            icon={Building2}
            value={form.clientId}
            onChange={(e) => update("clientId", e.target.value)}
            options={[
              { value: "", label: "— Select Client —" },
              ...clients.map((c) => ({
                value: c.id,
                label: c.companyName,
              })),
            ]}
          />
          <SettingsSelect
            label="Account Manager"
            icon={UserCheck}
            value={form.accountManagerId}
            onChange={(e) => update("accountManagerId", e.target.value)}
            options={[
              { value: "", label: "— Unassigned —" },
              ...managers.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role.replace(/_/g, " ")})`,
              })),
            ]}
          />
        </div>
      </SettingsCard>

      {/* ─── Services ─── */}
      <SettingsCard
        title="Services"
        description="Optionally select services for this project. Prices can be adjusted as a snapshot."
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
            No services added yet. Services are optional — their prices will auto-sum as a budget suggestion.
          </div>
        ) : (
          <div className="space-y-3">
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

            <div className="flex items-center justify-between px-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Services Total</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {format(servicesTotal)}
              </span>
            </div>
          </div>
        )}
      </SettingsCard>

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

      <SettingsCard
        title="Notes"
        description="Additional context or details about this project."
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

      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <SettingsButton
          isPending={isPending}
          onClick={handleSubmit}
          label="Create Project"
        />
      </div>
    </div>
  );
}
