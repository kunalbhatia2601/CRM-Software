"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Handshake,
  DollarSign,
  CalendarClock,
  UserCheck,
} from "lucide-react";

import { updateDeal, getDealAssignableUsers } from "@/actions/deals.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

function toDateInput(iso) {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
}

export default function EditDealContent({ deal }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [assignees, setAssignees] = useState([]);

  const isWon = deal.stage === "WON";

  const [form, setForm] = useState({
    title: deal.title || "",
    value: deal.value || "",
    assigneeId: deal.assigneeId || "",
    expectedCloseAt: toDateInput(deal.expectedCloseAt),
    notes: deal.notes || "",
  });

  useEffect(() => {
    getDealAssignableUsers().then(setAssignees);
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = () => {
    if (!form.title.trim()) {
      showToast("error", "Deal title is required");
      return;
    }

    startTransition(async () => {
      const payload = { ...form };
      if (payload.value) payload.value = parseFloat(payload.value);
      else payload.value = null;
      if (!payload.assigneeId) payload.assigneeId = null;
      if (!payload.expectedCloseAt) payload.expectedCloseAt = null;
      if (!payload.notes) payload.notes = null;

      const result = await updateDeal(deal.id, payload);
      if (result.success) {
        showToast("success", "Deal updated successfully");
      } else {
        showToast("error", result.error || "Failed to update deal");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title={`Edit — ${deal.title}`}
        description={`From lead: ${deal.lead?.companyName || "—"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Deals", href: "/owner/deals" },
          { label: deal.title, href: `/owner/deals/${deal.id}` },
          { label: "Edit" },
        ]}
      />

      {isWon && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[20px] p-5 flex items-center gap-3">
          <Badge value="WON" />
          <p className="text-sm text-emerald-700 font-medium">
            This deal has been won and cannot be edited.
          </p>
        </div>
      )}

      <SettingsCard
        title="Deal Details"
        description="Update the deal title, value, and timeline."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <SettingsInput
              label="Deal Title *"
              icon={Handshake}
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Deal title"
              disabled={isWon}
            />
          </div>
          <SettingsInput
            label="Deal Value"
            type="number"
            icon={DollarSign}
            value={form.value}
            onChange={(e) => update("value", e.target.value)}
            placeholder="50000"
            disabled={isWon}
          />
          <SettingsInput
            label="Expected Close Date"
            type="date"
            icon={CalendarClock}
            value={form.expectedCloseAt}
            onChange={(e) => update("expectedCloseAt", e.target.value)}
            disabled={isWon}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Assignment"
        description="Reassign this deal to a different sales person."
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
            disabled={isWon}
          />
          {deal.assignee && (
            <p className="text-xs text-slate-500 mt-2">
              Currently assigned to{" "}
              <span className="font-medium text-slate-700">
                {deal.assignee.firstName} {deal.assignee.lastName}
              </span>
            </p>
          )}
        </div>
      </SettingsCard>

      <SettingsCard title="Notes" description="Additional context for this deal.">
        <div>
          <label className="text-sm font-semibold text-slate-800 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Deal notes..."
            disabled={isWon}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </SettingsCard>

      {!isWon && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <SettingsButton isPending={isPending} onClick={handleSave} label="Save Changes" />
        </div>
      )}
    </div>
  );
}
