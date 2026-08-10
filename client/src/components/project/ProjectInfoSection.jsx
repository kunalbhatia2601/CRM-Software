"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderKanban, FileText, Calendar, DollarSign, RefreshCw, CalendarClock,
  Pencil, Check, X, Loader2, ExternalLink, User,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { updateProject, getProjectAccountManagers } from "@/actions/projects.action";

const STATUSES = ["NOT_STARTED", "DUE_SIGNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];
const BILLING_CYCLES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"];

const label = (v) => (v || "").replaceAll("_", " ");

/**
 * Fixed-locale date rendering. `toLocaleDateString()` with no locale resolves
 * differently on the server (node's locale) than in the browser, which breaks
 * hydration — pin it explicitly.
 */
function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/** yyyy-mm-dd for <input type="date">, empty when unset. */
function toDateInput(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function InfoRow({ icon: Icon, label: rowLabel, value, link, external }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[100px]">{rowLabel}</span>
      {link ? (
        <Link
          href={link}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
        >
          {value || "—"}
          {external && <ExternalLink className="w-3 h-3" />}
        </Link>
      ) : (
        <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{value || "—"}</span>
      )}
    </div>
  );
}

/**
 * Project information card with in-place editing.
 *
 * @param {object}   project    full project row
 * @param {boolean}  canManage  show the edit control
 * @param {Function} onUpdated  called with the updated project
 */
export default function ProjectInfoSection({ project, canManage = false, onUpdated }) {
  const { format } = useSite();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState(null);

  const isRecurring = project.billingCycle && project.billingCycle !== "ONE_TIME";
  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

  const openEdit = async () => {
    setForm({
      name: project.name || "",
      description: project.description || "",
      startDate: toDateInput(project.startDate),
      endDate: toDateInput(project.endDate),
      budget: project.budget != null ? String(project.budget) : "",
      status: project.status || "NOT_STARTED",
      billingCycle: project.billingCycle || "ONE_TIME",
      accountManagerId: project.accountManagerId || "",
    });
    setEditing(true);
    if (managers.length === 0) setManagers(await getProjectAccountManagers());
  };

  const save = async () => {
    if (!form.name.trim()) {
      setToast({ type: "error", message: "Project name is required" });
      return;
    }
    setSaving(true);
    const res = await updateProject(project.id, {
      name: form.name.trim(),
      description: form.description.trim() || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      budget: form.budget === "" ? null : Number(form.budget),
      status: form.status,
      billingCycle: form.billingCycle,
      accountManagerId: form.accountManagerId || null,
    });
    setSaving(false);

    if (res.success) {
      setToast({ type: "success", message: "Project updated" });
      setEditing(false);
      onUpdated?.(res.data);
    } else {
      setToast({ type: "error", message: res.error || "Failed to update project" });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Project Information</h3>
        </div>
        {canManage && !editing && (
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Name *</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Description</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Start Date</label>
              <input type="date" className={inputClass} value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">End Date</label>
              <input type="date" className={inputClass} value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Budget</label>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Not set" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
              <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Billing Cycle</label>
              <select className={inputClass} value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                {BILLING_CYCLES.map((b) => <option key={b} value={b}>{label(b)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Account Manager</label>
              <select className={inputClass} value={form.accountManagerId}
                onChange={(e) => setForm({ ...form, accountManagerId: e.target.value })}>
                <option value="">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {label(m.role)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4435cc] disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <InfoRow icon={FolderKanban} label="Name" value={project.name} />
          <InfoRow icon={FileText} label="Description" value={project.description} />
          <InfoRow icon={Calendar} label="Start Date" value={formatDate(project.startDate)} />
          <InfoRow icon={Calendar} label="End Date" value={formatDate(project.endDate)} />
          <InfoRow icon={DollarSign} label="Budget" value={project.budget ? format(Number(project.budget), { decimals: 0 }) : "Not Set"} />
          <InfoRow icon={RefreshCw} label="Billing" value={label(project.billingCycle)} />
          {isRecurring && (
            <InfoRow icon={CalendarClock} label="Next Billing"
              value={formatDate(project.nextBillingDate)} />
          )}
          <InfoRow
            icon={User}
            label="Account Manager"
            value={project.accountManager ? `${project.accountManager.firstName} ${project.accountManager.lastName}` : null}
          />
          <InfoRow icon={Calendar} label="Created" value={formatDate(project.createdAt)} />
        </div>
      )}
    </div>
  );
}
