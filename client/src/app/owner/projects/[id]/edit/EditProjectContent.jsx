"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  Calendar,
  DollarSign,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { updateProject, getProjectAccountManagers } from "@/actions/projects.action";
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

export default function EditProjectContent({ project }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [managers, setManagers] = useState([]);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: project.name || "",
    description: project.description || "",
    status: project.status || "NOT_STARTED",
    startDate: toDateInput(project.startDate),
    endDate: toDateInput(project.endDate),
    budget: project.budget || "",
    notes: project.notes || "",
    accountManagerId: project.accountManagerId || "",
    billingCycle: project.billingCycle || "ONE_TIME",
    nextBillingDate: toDateInput(project.nextBillingDate),
  });

  useEffect(() => {
    getProjectAccountManagers().then(setManagers);
  }, []);

  const isLocked = ["COMPLETED", "CANCELLED"].includes(project.status);
  const isFieldDisabled = isLocked && form.status === project.status;

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast("error", "Project name is required");
      return;
    }

    startTransition(async () => {
      const payload = { ...form };
      if (payload.budget) payload.budget = parseFloat(payload.budget);
      else payload.budget = null;
      if (!payload.description) payload.description = null;
      if (!payload.startDate) payload.startDate = null;
      if (!payload.endDate) payload.endDate = null;
      if (!payload.notes) payload.notes = null;
      if (!payload.accountManagerId) payload.accountManagerId = null;
      if (payload.billingCycle === "ONE_TIME") {
        payload.nextBillingDate = null;
      }
      if (!payload.nextBillingDate) payload.nextBillingDate = null;

      const result = await updateProject(project.id, payload);
      if (result.success) {
        showToast("success", "Project updated successfully");
      } else {
        showToast("error", result.error || "Failed to update project");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title={`Edit — ${project.name}`}
        description={`Client: ${project.client?.companyName || "—"}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Projects", href: "/owner/projects" },
          { label: project.name, href: `/owner/projects/${project.id}` },
          { label: "Edit" },
        ]}
      />

      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-5 flex items-center gap-3">
          <Badge value={project.status} />
          <p className="text-sm text-amber-700 font-medium">
            This project is {project.status.toLowerCase().replace(/_/g, " ")}. Change the status to edit other fields.
          </p>
        </div>
      )}

      <SettingsCard
        title="Project Details"
        description="Update the project name and description."
      >
        <div className="grid grid-cols-1 gap-6">
          <SettingsInput
            label="Project Name *"
            icon={FolderKanban}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Project name"
            disabled={isFieldDisabled}
          />
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Project description..."
              disabled={isFieldDisabled}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Status & Assignment"
        description="Update the project status and account manager."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSelect
            label="Status"
            icon={FolderKanban}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            options={[
              { value: "NOT_STARTED", label: "Not Started" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "ON_HOLD", label: "On Hold" },
              { value: "COMPLETED", label: "Completed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
          <div>
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
              disabled={isFieldDisabled}
            />
            {project.accountManager && (
              <p className="text-xs text-slate-500 mt-2">
                Currently assigned to{" "}
                <span className="font-medium text-slate-700">
                  {project.accountManager.firstName} {project.accountManager.lastName}
                </span>
              </p>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Timeline & Budget"
        description="Adjust the project schedule and budget."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SettingsInput
            label="Start Date"
            type="date"
            icon={Calendar}
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            disabled={isFieldDisabled}
          />
          <SettingsInput
            label="End Date"
            type="date"
            icon={Calendar}
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
            disabled={isFieldDisabled}
          />
          <SettingsInput
            label="Budget"
            type="number"
            icon={DollarSign}
            value={form.budget}
            onChange={(e) => update("budget", e.target.value)}
            placeholder="50000"
            disabled={isFieldDisabled}
          />
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
            disabled={isFieldDisabled}
          />
          {form.billingCycle !== "ONE_TIME" && (
            <SettingsInput
              label="Next Billing Date"
              type="date"
              icon={Calendar}
              value={form.nextBillingDate}
              onChange={(e) => update("nextBillingDate", e.target.value)}
              disabled={isFieldDisabled}
            />
          )}
        </div>
        {form.billingCycle !== "ONE_TIME" && (
          <p className="text-xs text-slate-400 mt-2">
            Leave empty to auto-calculate from the start date.
          </p>
        )}
      </SettingsCard>

      <SettingsCard title="Notes" description="Additional context for this project.">
        <div>
          <label className="text-sm font-semibold text-slate-800 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Project notes..."
            disabled={isFieldDisabled}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </SettingsCard>

      {(!isLocked || form.status !== project.status) && (
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
