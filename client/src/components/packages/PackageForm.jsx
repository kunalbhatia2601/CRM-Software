"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Plus, Trash2, DollarSign } from "lucide-react";
import { getServicesDropdown } from "@/actions/services.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

/** A package row's own item shape ↔ the form's editable row shape. */
function toFormItems(items = []) {
  return items.map((i) => ({
    serviceId: i.serviceId || i.service?.id,
    quantity: i.quantity || 1,
    // "" means "use the service's own price" — kept separate from 0, which is a real override.
    priceOverride: i.priceOverride != null ? String(i.priceOverride) : "",
  }));
}

/**
 * Create/edit form for a Service Package — shared so the two pages stay in
 * sync instead of drifting like copy-pasted forms tend to.
 */
export default function PackageForm({ initialPackage = null, onSubmit, submitLabel }) {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [catalog, setCatalog] = useState([]);

  const [form, setForm] = useState({
    name: initialPackage?.name || "",
    description: initialPackage?.description || "",
    isActive: initialPackage?.isActive ?? true,
    items: toFormItems(initialPackage?.items),
  });

  useEffect(() => {
    getServicesDropdown().then(setCatalog);
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const catalogById = Object.fromEntries(catalog.map((s) => [s.id, s]));
  const usedIds = new Set(form.items.map((i) => i.serviceId).filter(Boolean));

  const addItem = () => {
    const next = catalog.find((s) => !usedIds.has(s.id));
    if (!next) {
      showToast("error", "Every active service is already in this package.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { serviceId: next.id, quantity: 1, priceOverride: "" }],
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  // What this package will actually cost — same rule the server applies:
  // override price if set, else the service's sale/list price.
  const total = form.items.reduce((sum, it) => {
    const svc = catalogById[it.serviceId];
    const unitPrice = it.priceOverride !== "" ? Number(it.priceOverride) : Number(svc?.salePrice ?? svc?.price ?? 0);
    return sum + unitPrice * (Number(it.quantity) || 1);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("error", "Package name is required.");
      return;
    }
    if (form.items.length === 0) {
      showToast("error", "Add at least one service to this package.");
      return;
    }
    if (form.items.some((i) => !i.serviceId)) {
      showToast("error", "Pick a service for every row.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
      items: form.items.map((i) => ({
        serviceId: i.serviceId,
        quantity: Number(i.quantity) || 1,
        priceOverride: i.priceOverride === "" ? null : Number(i.priceOverride),
      })),
    };

    startTransition(async () => {
      const result = await onSubmit(payload);
      if (result.success) {
        showToast("success", `Package ${initialPackage ? "updated" : "created"} successfully!`);
        setTimeout(() => router.push("/owner/packages"), 500);
      } else {
        showToast("error", result.error || "Failed to save package.");
      }
    });
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/owner/dashboard" },
    { label: "Packages", href: "/owner/packages" },
    { label: initialPackage ? "Edit Package" : "New Package" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} />}

      <PageHeader
        title={initialPackage ? "Edit Package" : "New Package"}
        description="A named bundle of services — e.g. Gold Plan — added to a deal or project in one step."
        breadcrumbs={breadcrumbs}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <SettingsCard title="Package Info" description="Name and describe this plan.">
          <SettingsInput
            label="Package Name"
            placeholder="e.g., Gold Plan"
            icon={Boxes}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 dark:text-slate-50">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Who this plan is for and what makes it different..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
              rows="3"
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Services Included"
          description="Every service here is added automatically when this package is picked. Set a price to override that service's own price just for this plan."
        >
          <div className="space-y-3">
            {form.items.map((item, index) => {
              const svc = catalogById[item.serviceId];
              const defaultPrice = Number(svc?.salePrice ?? svc?.price ?? 0);
              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                >
                  <SettingsSelect
                    label="Service"
                    value={item.serviceId || ""}
                    onChange={(e) => updateItem(index, "serviceId", e.target.value)}
                    className="flex-1"
                    options={[
                      { value: "", label: "— Select Service —" },
                      ...catalog
                        .filter((s) => s.id === item.serviceId || !usedIds.has(s.id))
                        .map((s) => ({ value: s.id, label: s.name })),
                    ]}
                  />
                  <SettingsInput
                    label="Qty"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className="w-full sm:w-24"
                  />
                  <SettingsInput
                    label={`Price override (default ${format(defaultPrice)})`}
                    icon={DollarSign}
                    type="number"
                    min="0"
                    placeholder={String(defaultPrice)}
                    value={item.priceOverride}
                    onChange={(e) => updateItem(index, "priceOverride", e.target.value)}
                    className="w-full sm:w-56"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors shrink-0"
                    title="Remove service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-semibold hover:border-[#5542F6] hover:text-[#5542F6] transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>

          {form.items.length > 0 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Package Total</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
                {format(total)}
              </span>
            </div>
          )}
        </SettingsCard>

        <SettingsCard title="Status" description="Control whether this package can be picked.">
          <SettingsSelect
            label="Package Status"
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => update("isActive", e.target.value === "active")}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </SettingsCard>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <SettingsButton label={submitLabel} isPending={isPending} onClick={() => {}} />
        </div>
      </form>
    </div>
  );
}
