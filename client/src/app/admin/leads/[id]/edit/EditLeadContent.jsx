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
  CalendarClock,
  UserCheck,
} from "lucide-react";

import { updateLead, getAssignableUsers } from "@/actions/leads.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
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

// Format datetime-local string from ISO
function toDateTimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditLeadContent({ lead }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [assignees, setAssignees] = useState([]);

  const isConverted = lead.status === "CONVERTED";

  const [form, setForm] = useState({
    companyName: lead.companyName || "",
    contactName: lead.contactName || "",
    email: lead.email || "",
    phone: lead.phone || "",
    source: lead.source || "OTHER",
    priority: lead.priority || "MEDIUM",
    estimatedValue: lead.estimatedValue || "",
    notes: lead.notes || "",
    assigneeId: lead.assigneeId || "",
    followUpAt: toDateTimeLocal(lead.followUpAt),
  });

  useEffect(() => {
    getAssignableUsers().then(setAssignees);
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = () => {
    if (!form.companyName || !form.contactName) {
      showToast("error", "Company name and contact name are required");
      return;
    }

    startTransition(async () => {
      const payload = { ...form };
      if (!payload.email) payload.email = null;
      if (!payload.phone) payload.phone = null;
      if (!payload.notes) payload.notes = null;
      if (!payload.assigneeId) payload.assigneeId = null;
      if (!payload.followUpAt) payload.followUpAt = null;
      if (payload.estimatedValue) {
        payload.estimatedValue = parseFloat(payload.estimatedValue);
      } else {
        payload.estimatedValue = null;
      }

      const result = await updateLead(lead.id, payload);
      if (result.success) {
        showToast("success", "Lead updated successfully");
      } else {
        showToast("error", result.error || "Failed to update lead");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title={`Edit — ${lead.companyName}`}
        description={`Editing lead for ${lead.contactName}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Leads", href: "/admin/leads" },
          { label: lead.companyName, href: `/admin/leads/${lead.id}` },
          { label: "Edit" },
        ]}
      />

      {/* Status Banner for Converted leads */}
      {isConverted && (
        <div className="bg-green-50 border border-green-200 rounded-[20px] p-5 flex items-center gap-3">
          <Badge value="CONVERTED" />
          <p className="text-sm text-green-700 font-medium">
            This lead has been converted to a deal and cannot be edited.
          </p>
        </div>
      )}

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
            disabled={isConverted}
          />
          <SettingsInput
            label="Contact Name *"
            icon={User}
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            placeholder="John Smith"
            disabled={isConverted}
          />
          <SettingsInput
            label="Email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@acme.com"
            disabled={isConverted}
          />
          <SettingsInput
            label="Phone"
            icon={Phone}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 98765-43210"
            disabled={isConverted}
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
            disabled={isConverted}
          />
          <SettingsSelect
            label="Priority"
            icon={Shield}
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
            options={PRIORITIES}
            disabled={isConverted}
          />
          <SettingsInput
            label="Estimated Value"
            type="number"
            icon={DollarSign}
            value={form.estimatedValue}
            onChange={(e) => update("estimatedValue", e.target.value)}
            placeholder="50000"
            disabled={isConverted}
          />
          <SettingsInput
            label="Follow-Up Date"
            type="datetime-local"
            icon={CalendarClock}
            value={form.followUpAt}
            onChange={(e) => update("followUpAt", e.target.value)}
            disabled={isConverted}
          />
        </div>
      </SettingsCard>

      {/* Assignment */}
      <SettingsCard
        title="Assignment"
        description="Assign or reassign this lead to a sales team member."
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
            disabled={isConverted}
          />
          {lead.assignee && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Currently assigned to{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {lead.assignee.firstName} {lead.assignee.lastName}
              </span>
            </p>
          )}
        </div>
      </SettingsCard>

      {/* Notes */}
      <SettingsCard
        title="Notes"
        description="Additional context or details about this lead."
      >
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Add any additional notes..."
            disabled={isConverted}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </SettingsCard>

      {!isConverted && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <SettingsButton
            isPending={isPending}
            onClick={handleSave}
            label="Save Changes"
          />
        </div>
      )}
    </div>
  );
}
