"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  Mail,
  Phone,
  Shield,
  DollarSign,
  FileText,
  CalendarClock,
  UserCheck,
} from "lucide-react";

import { createLead, getAssignableUsers } from "@/actions/leads.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

const SOURCES = [
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "COLD_CALL", label: "Cold Call" },
  { value: "EMAIL_CAMPAIGN", label: "Email Campaign" },
  { value: "ADVERTISEMENT", label: "Advertisement" },
  { value: "META_AD", label: "Meta Ad" },
  { value: "EVENT", label: "Event" },
  { value: "PARTNER", label: "Partner" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function CreateLeadContent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [assignees, setAssignees] = useState([]);

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    source: "OTHER",
    priority: "MEDIUM",
    estimatedValue: "",
    notes: "",
    assigneeId: "",
    followUpAt: "",
  });

  useEffect(() => {
    getAssignableUsers().then(setAssignees);
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
      // Clean up empty optional fields
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      if (!payload.notes) delete payload.notes;
      if (!payload.assigneeId) delete payload.assigneeId;
      if (!payload.followUpAt) delete payload.followUpAt;
      if (payload.estimatedValue) {
        payload.estimatedValue = parseFloat(payload.estimatedValue);
      } else {
        delete payload.estimatedValue;
      }

      const result = await createLead(payload);
      if (result.success) {
        router.push("/owner/leads");
      } else {
        setToast({ type: "error", message: result.error || "Failed to create lead" });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Add Lead"
        description="Capture a new lead or prospect for your sales pipeline."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Leads", href: "/owner/leads" },
          { label: "Add Lead" },
        ]}
      />

      {/* Company & Contact Details */}
      <SettingsCard
        title="Company & Contact"
        description="Basic information about the lead's company and primary contact."
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

      {/* Lead Classification */}
      <SettingsCard
        title="Lead Classification"
        description="Categorize the lead by source, priority, and estimated value."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSelect
            label="Source"
            icon={Shield}
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
            options={SOURCES}
          />
          <SettingsSelect
            label="Priority"
            icon={Shield}
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
            options={PRIORITIES}
          />
          <SettingsInput
            label="Estimated Value"
            type="number"
            icon={DollarSign}
            value={form.estimatedValue}
            onChange={(e) => update("estimatedValue", e.target.value)}
            placeholder="50000"
          />
          <SettingsInput
            label="Follow-Up Date"
            type="datetime-local"
            icon={CalendarClock}
            value={form.followUpAt}
            onChange={(e) => update("followUpAt", e.target.value)}
          />
        </div>
      </SettingsCard>

      {/* Assignment */}
      <SettingsCard
        title="Assignment"
        description="Assign this lead to a sales team member."
      >
        <div className="max-w-md">
          <SettingsSelect
            label="Assign To"
            icon={UserCheck}
            value={form.assigneeId}
            onChange={(e) => update("assigneeId", e.target.value)}
            options={[
              { value: "", label: "— Unassigned —" },
              ...assignees.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role.replace(/_/g, " ")})`,
              })),
            ]}
          />
        </div>
      </SettingsCard>

      {/* Notes */}
      <SettingsCard
        title="Notes"
        description="Additional context or details about this lead."
      >
        <div>
          <label className="text-sm font-semibold text-slate-800 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Add any additional notes, requirements, or context about this lead..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none"
          />
        </div>
      </SettingsCard>

      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <SettingsButton
          isPending={isPending}
          onClick={handleSubmit}
          label="Create Lead"
        />
      </div>
    </div>
  );
}
