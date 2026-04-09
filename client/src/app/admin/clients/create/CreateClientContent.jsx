"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  UserCheck,
} from "lucide-react";

import { createClient, getAccountManagers } from "@/actions/clients.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function CreateClientContent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [managers, setManagers] = useState([]);

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
    website: "",
    notes: "",
    accountManagerId: "",
  });

  useEffect(() => {
    getAccountManagers().then(setManagers);
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = () => {
    if (!form.companyName || !form.contactName) {
      setToast({ type: "error", message: "Company name and contact name are required" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    startTransition(async () => {
      const payload = { ...form };
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      if (!payload.address) delete payload.address;
      if (!payload.industry) delete payload.industry;
      if (!payload.website) delete payload.website;
      if (!payload.notes) delete payload.notes;
      if (!payload.accountManagerId) delete payload.accountManagerId;

      const result = await createClient(payload);
      if (result.success) {
        router.push(`/admin/clients/${result.data.id}`);
      } else {
        setToast({ type: "error", message: result.error || "Failed to create client" });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Add Client"
        description="Register a new client company for your agency."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Clients", href: "/admin/clients" },
          { label: "Add Client" },
        ]}
      />

      <SettingsCard
        title="Company & Contact"
        description="Basic information about the client's company and primary contact."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsInput
            label="Company Name *"
            icon={Building2}
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="Acme Corporation"
          />
          <SettingsInput
            label="Contact Name *"
            icon={User}
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            placeholder="John Smith"
          />
          <SettingsInput
            label="Email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@acme.com"
          />
          <SettingsInput
            label="Phone"
            icon={Phone}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 98765-43210"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Business Details"
        description="Industry, address, and web presence."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsInput
            label="Industry"
            icon={Briefcase}
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
            placeholder="Technology, Healthcare, Finance..."
          />
          <SettingsInput
            label="Website"
            icon={Globe}
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://acme.com"
          />
        </div>
        <div className="mt-6">
          <SettingsInput
            label="Address"
            icon={MapPin}
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="123 Business Ave, New Delhi, India"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Assignment"
        description="Assign an account manager to handle this client."
      >
        <div className="max-w-md">
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

      <SettingsCard
        title="Notes"
        description="Additional context or details about this client."
      >
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Key requirements, preferences, or any context about this client..."
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
          label="Create Client"
        />
      </div>
    </div>
  );
}
