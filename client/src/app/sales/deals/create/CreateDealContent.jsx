"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Handshake,
  DollarSign,
  CalendarClock,
  UserCheck,
  FileText,
  Target,
} from "lucide-react";

import { createDeal, getQualifiedLeads, getDealAssignableUsers } from "@/actions/deals.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function CreateDealContent() {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [leads, setLeads] = useState([]);
  const [assignees, setAssignees] = useState([]);

  const [form, setForm] = useState({
    leadId: "",
    title: "",
    value: "",
    assigneeId: "",
    expectedCloseAt: "",
    notes: "",
  });

  useEffect(() => {
    getQualifiedLeads().then(setLeads);
    getDealAssignableUsers().then(setAssignees);
  }, []);

  const update = (field, value) => {
    setForm((p) => {
      const next = { ...p, [field]: value };
      // Auto-fill when a lead is selected
      if (field === "leadId" && value) {
        const lead = leads.find((l) => l.id === value);
        if (lead) {
          next.title = `${lead.companyName} — Deal`;
          next.value = lead.estimatedValue || "";
          if (lead.assigneeId && !next.assigneeId) next.assigneeId = lead.assigneeId;
        }
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.leadId) {
      setToast({ type: "error", message: "Please select a qualified lead" });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (!form.title.trim()) {
      setToast({ type: "error", message: "Deal title is required" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    startTransition(async () => {
      const payload = { leadId: form.leadId, title: form.title.trim() };
      if (form.value) payload.value = parseFloat(form.value);
      if (form.assigneeId) payload.assigneeId = form.assigneeId;
      if (form.expectedCloseAt) payload.expectedCloseAt = form.expectedCloseAt;
      if (form.notes) payload.notes = form.notes;

      const result = await createDeal(payload);
      if (result.success) {
        router.push(`/sales/deals/${result.data.id}`);
      } else {
        setToast({ type: "error", message: result.error || "Failed to create deal" });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Create Deal"
        description="Convert a qualified lead into a deal to start your sales pipeline."
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Deals", href: "/sales/deals" },
          { label: "New Deal" },
        ]}
      />

      {/* Select Lead */}
      <SettingsCard
        title="Select Lead"
        description="Choose a qualified lead to convert into a deal."
      >
        <div className="max-w-lg">
          <SettingsSelect
            label="Qualified Lead *"
            icon={Target}
            value={form.leadId}
            onChange={(e) => update("leadId", e.target.value)}
            options={[
              { value: "", label: "— Select a qualified lead —" },
              ...leads.map((l) => ({
                value: l.id,
                label: `${l.companyName} — ${l.contactName}${l.estimatedValue ? ` (Est. ${l.estimatedValue})` : ""}`,
              })),
            ]}
          />
          {leads.length === 0 && (
            <p className="text-xs text-amber-500 mt-2">
              No qualified leads available. Mark a lead as Qualified first.
            </p>
          )}
        </div>
      </SettingsCard>

      {/* Deal Details */}
      <SettingsCard
        title="Deal Details"
        description="Define the deal title, value, and timeline."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <SettingsInput
              label="Deal Title *"
              icon={Handshake}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g., Acme Corp — Website Redesign"
            />
          </div>
          <SettingsInput
            label="Deal Value"
            type="number"
            icon={DollarSign}
            value={form.value}
            onChange={(e) => update("value", e.target.value)}
            placeholder="50000"
          />
          <SettingsInput
            label="Expected Close Date"
            type="date"
            icon={CalendarClock}
            value={form.expectedCloseAt}
            onChange={(e) => update("expectedCloseAt", e.target.value)}
          />
        </div>
      </SettingsCard>

      {/* Assignment */}
      <SettingsCard
        title="Assignment"
        description="Assign this deal to a sales team member."
      >
        <div className="max-w-md">
          <SettingsSelect
            label="Assign To"
            icon={UserCheck}
            value={form.assigneeId}
            onChange={(e) => update("assigneeId", e.target.value)}
            options={[
              { value: "", label: "— Inherit from lead —" },
              ...assignees.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role.replace(/_/g, " ")})`,
              })),
            ]}
          />
        </div>
      </SettingsCard>

      {/* Notes */}
      <SettingsCard title="Notes" description="Additional context for this deal.">
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Deal scope, requirements, key contacts..."
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
        <SettingsButton isPending={isPending} onClick={handleSubmit} label="Create Deal" />
      </div>
    </div>
  );
}
