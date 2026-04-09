"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PackageCheck,
  DollarSign,
  FileText,
  ListChecks,
  Plus,
  X,
} from "lucide-react";
import { updateService } from "@/actions/services.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function EditServiceContent({ service }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: service.name || "",
    description: service.description || "",
    price: service.price?.toString() || "",
    salePrice: service.salePrice?.toString() || "",
    points: Array.isArray(service.points) ? service.points : [],
    isActive: service.isActive ?? true,
  });

  const [newPoint, setNewPoint] = useState("");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addPoint = () => {
    if (newPoint.trim()) {
      setForm((prev) => ({
        ...prev,
        points: [...prev.points, newPoint.trim()],
      }));
      setNewPoint("");
    }
  };

  const removePoint = (index) => {
    setForm((prev) => ({
      ...prev,
      points: prev.points.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      showToast("error", "Service name is required.");
      return;
    }

    if (!form.price) {
      showToast("error", "Service price is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      points: form.points,
      isActive: form.isActive,
    };

    if (form.salePrice) {
      payload.salePrice = parseFloat(form.salePrice);
    }

    startTransition(async () => {
      const result = await updateService(service.id, payload);

      if (result.success) {
        showToast("success", "Service updated successfully!");
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        showToast("error", result.error || "Failed to update service.");
      }
    });
  };

  const breadcrumbs = [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Services", href: "/admin/services" },
    { label: service.name, href: `/admin/services/${service.id}` },
    { label: "Edit" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && (
        <Toast toast={toast} />
      )}

      <PageHeader
        title={`Edit — ${service.name}`}
        description="Update service details and pricing."
        breadcrumbs={breadcrumbs}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Info */}
        <SettingsCard
          title="Service Info"
          description="Basic service details."
        >
          <SettingsInput
            label="Service Name"
            placeholder="e.g., Logo Design Package"
            icon={PackageCheck}
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
              placeholder="Describe what this service includes..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
              rows="4"
            />
          </div>
        </SettingsCard>

        {/* Pricing */}
        <SettingsCard
          title="Pricing"
          description="Set the service price and optional sale price."
        >
          <SettingsInput
            label="Price"
            placeholder="10000"
            icon={DollarSign}
            type="number"
            value={form.price}
            onChange={(e) => update("price", e.target.value)}
            required
          />
          <SettingsInput
            label="Sale Price (Optional)"
            placeholder="8500"
            icon={DollarSign}
            type="number"
            value={form.salePrice}
            onChange={(e) => update("salePrice", e.target.value)}
          />
        </SettingsCard>

        {/* What's Included */}
        <SettingsCard
          title="What's Included"
          description="List the key deliverables of this service."
        >
          <div className="flex gap-2 mb-4">
            <input
              value={newPoint}
              onChange={(e) => setNewPoint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPoint();
                }
              }}
              placeholder="e.g., Logo Design, Brand Book..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
            <button
              type="button"
              onClick={addPoint}
              disabled={!newPoint.trim()}
              className="px-4 py-3 bg-[#5542F6] text-white rounded-xl text-sm font-semibold hover:bg-[#4636d4] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {form.points.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.points.map((point, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100 dark:border-indigo-900/30"
                >
                  {point}
                  <button
                    type="button"
                    onClick={() => removePoint(i)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </SettingsCard>

        {/* Status */}
        <SettingsCard
          title="Status"
          description="Control whether this service is available."
        >
          <SettingsSelect
            label="Service Status"
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => update("isActive", e.target.value === "active")}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
        </SettingsCard>

        {/* Actions */}
        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <SettingsButton
            label="Save Changes"
            isPending={isPending}
            onClick={() => {}}
          />
        </div>
      </form>
    </div>
  );
}
