"use client";

import { useState, useEffect, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import {
  Wallet, Loader2, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Building2, Trash2, AlertCircle, Check, Megaphone, TrendingUp, X
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import {
  getAdBudgetOverview, getAdBudgetLedger, addAdBudgetEntry, deleteAdBudgetEntry,
} from "@/actions/campaigns.action";
import { getProjectOptions } from "@/actions/projects.action";

// Marketing spends the pot; only these roles put money into it.
const FUNDER_ROLES = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SOURCE_LABEL = {
  CLIENT_PAID: "Client paid",
  AGENCY_ALLOTTED: "Agency allotted",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

/**
 * Ad budget, held per project.
 *
 * Two funding sources sit side by side: what the client paid, and what the
 * agency chose to add on top. Keeping them tagged is the point — it is the only
 * way to answer "how much have we subsidised this client".
 *
 * @param {string} basePath role base, e.g. "/marketing"
 */
export default function AdBudgetContent({ basePath = "/marketing" }) {
  const { user } = useAuth();
  const { format } = useSite();
  const money = (n) => format(Number(n) || 0, { decimals: 0 });

  const canFund = FUNDER_ROLES.includes(user?.role);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [expandedId, setExpandedId] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const [funding, setFunding] = useState(null);   // { projectId } while the form is open
  const [form, setForm] = useState({ source: "CLIENT_PAID", amount: "", taxAmount: "", reference: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [projects, setProjects] = useState([]);
  const [newFund, setNewFund] = useState(null);   // { projectId } when open

  useEffect(() => {
    if (canFund) getProjectOptions().then(setProjects);
  }, [canFund]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getAdBudgetOverview({ year, month });
    if (res.success) setRows(res.data);
    else setToast({ type: "error", message: res.error });
    setLoading(false);
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const openLedger = async (projectId) => {
    if (expandedId === projectId) { setExpandedId(null); setLedger(null); return; }
    setExpandedId(projectId);
    setLedger(null);
    setFunding(null);
    setLoadingLedger(true);
    const res = await getAdBudgetLedger(projectId, { year, month });
    setLoadingLedger(false);
    if (res.success) setLedger(res.data);
    else setToast({ type: "error", message: res.error });
  };

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m); setYear(y);
    setExpandedId(null); setLedger(null);
  };

  const submitFunds = async (projectId, { inline = true } = {}) => {
    if (!projectId) {
      setToast({ type: "error", message: "Pick a project first" });
      return;
    }
    if (!(Number(form.amount) > 0)) {
      setToast({ type: "error", message: "Amount must be more than zero" });
      return;
    }
    setSaving(true);
    const res = await addAdBudgetEntry(projectId, {
      source: form.source,
      amount: Number(form.amount),
      taxAmount: Number(form.taxAmount) || 0,
      reference: form.reference.trim() || null,
      note: form.note.trim() || null,
      periodYear: year,
      periodMonth: month,
    });
    setSaving(false);
    if (res.success) {
      if (inline) setLedger(res.data);
      setFunding(null);
      setNewFund(null);
      setForm({ source: "CLIENT_PAID", amount: "", taxAmount: "", reference: "", note: "" });
      setToast({ type: "success", message: "Funds released" });
      load();
    } else setToast({ type: "error", message: res.error });
  };

  const removeEntry = async () => {
    const res = await deleteAdBudgetEntry(deleting.id);
    if (res.success) {
      setLedger(res.data);
      setToast({ type: "success", message: "Entry removed" });
      load();
    } else setToast({ type: "error", message: res.error });
    setDeleting(null);
  };

  // Company-wide totals for the period.
  const totals = rows.reduce(
    (acc, r) => ({
      clientPaid: acc.clientPaid + r.budget.clientPaid,
      agencyAllotted: acc.agencyAllotted + r.budget.agencyAllotted,
      allocated: acc.allocated + r.budget.allocated,
      spent: acc.spent + r.budget.spent,
      available: acc.available + r.budget.available,
    }),
    { clientPaid: 0, agencyAllotted: 0, allocated: 0, spent: 0, available: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Ad Budget"
        description="Held per project. Client payments and agency top-ups, tracked separately."
        breadcrumbs={[{ label: "Dashboard", href: `${basePath}/dashboard` }, { label: "Ad Budget" }]}
        actions={
          canFund && !newFund && (
            <button
              onClick={() => { setNewFund({ projectId: "" }); setExpandedId(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]"
            >
              <Plus className="w-4 h-4" /> Release Funds
            </button>
          )
        }
      />

      {/* Fund any project — including one with no campaigns yet, which would
          not otherwise appear in the list below. */}
      {newFund && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Release funds · {MONTHS[month - 1]} {year}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Client payments and agency top-ups both land here, tagged by source.
              </p>
            </div>
            <button onClick={() => setNewFund(null)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Project *</label>
              <select className={inputClass} value={newFund.projectId}
                onChange={(e) => setNewFund({ projectId: e.target.value })}>
                <option value="">Select a project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Source</label>
              <select className={inputClass} value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="CLIENT_PAID">Client paid</option>
                <option value="AGENCY_ALLOTTED">Agency allotted</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Amount *</label>
              <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Tax</label>
              <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
                value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Reference</label>
              <input dir="ltr" className={inputClass} placeholder="Payment ref / approval"
                value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Note</label>
              <input dir="ltr" className={inputClass}
                value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => submitFunds(newFund.projectId, { inline: false })} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Release
            </button>
            <button onClick={() => setNewFund(null)}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Period nav + totals */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 w-36 text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={() => shiftMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Funding carries forward — unspent money stays with the project.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <p className="text-[11px] text-slate-400">Client paid</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50 tabular-nums">{money(totals.clientPaid)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10">
            <p className="text-[11px] text-slate-400">Agency allotted</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">{money(totals.agencyAllotted)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <p className="text-[11px] text-slate-400">Allocated</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50 tabular-nums">{money(totals.allocated)}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <p className="text-[11px] text-slate-400">Spent</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-50 tabular-nums">{money(totals.spent)}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/10">
            <p className="text-[11px] text-slate-400">Unallocated</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{money(totals.available)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            No project holds ad budget for {MONTHS[month - 1]} {year}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Use <b>Release Funds</b> above to fund a project, or create a campaign.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ project, budget }) => {
            const open = expandedId === project.id;
            const usePct = budget.allocated > 0 ? Math.min(100, (budget.spent / budget.allocated) * 100) : 0;

            return (
              <div key={project.id}
                className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 transition-all ${
                  open ? "border-[#5542F6] shadow-md" : "border-slate-200 dark:border-slate-800 hover:shadow-sm"
                }`}>
                <div role="button" tabIndex={0} onClick={() => openLedger(project.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLedger(project.id); } }}
                  className="flex items-start gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-[#5542F6]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{project.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {project.client?.companyName || "Internal"}
                      {budget.agencyAllotted > 0 && (
                        <span className="text-amber-600"> · {money(budget.agencyAllotted)} agency-funded</span>
                      )}
                    </p>

                    {budget.allocated > 0 && (
                      <div className="mt-2 max-w-sm">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>{money(budget.spent)} spent of {money(budget.allocated)} allocated</span>
                          <span>{usePct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full ${usePct >= 90 ? "bg-red-500" : usePct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${usePct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">{money(budget.funded)}</p>
                    <p className={`text-[11px] mt-0.5 ${budget.available > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                      {money(budget.available)} free
                    </p>
                    {open ? <ChevronUp className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                          : <ChevronDown className="w-4 h-4 text-slate-400 ml-auto mt-1" />}
                  </div>
                </div>

                {open && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {loadingLedger || !ledger ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                    ) : (
                      <div className="space-y-5">
                        {/* Release funds */}
                        {canFund && (funding?.projectId === project.id ? (
                          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-900/10 space-y-3">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                              Release funds · {MONTHS[month - 1]} {year}
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Source</label>
                                <select className={inputClass} value={form.source}
                                  onChange={(e) => setForm({ ...form, source: e.target.value })}>
                                  <option value="CLIENT_PAID">Client paid</option>
                                  <option value="AGENCY_ALLOTTED">Agency allotted</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Amount *</label>
                                <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
                                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Tax</label>
                                <input dir="ltr" type="number" min="0" step="0.01" className={inputClass}
                                  value={form.taxAmount} onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-slate-500 mb-1 block">Reference</label>
                                <input dir="ltr" className={inputClass} placeholder="Payment ref / approval"
                                  value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 mb-1 block">Note</label>
                              <input dir="ltr" className={inputClass}
                                value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => submitFunds(funding.projectId)} disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-60">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Release
                              </button>
                              <button onClick={() => setFunding(null)}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setFunding({ projectId: project.id })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-lg hover:bg-[#4636d4]">
                            <Plus className="w-3.5 h-3.5" /> Release funds
                          </button>
                        ))}

                        {!canFund && (
                          <p className="text-xs text-slate-400 italic flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Only finance, an admin or the owner can release funds into this budget.
                          </p>
                        )}

                        {/* Funding entries */}
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Funds released · {MONTHS[month - 1]} {year}
                          </p>
                          {ledger.entries.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Nothing released this month.</p>
                          ) : (
                            <div className="flex flex-col">
                              {ledger.entries.map((e) => (
                                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                    e.source === "AGENCY_ALLOTTED"
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                  }`}>
                                    {SOURCE_LABEL[e.source]}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 truncate">
                                      {e.reference || e.note || "—"}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      {e.approvedBy ? `${e.approvedBy.firstName} ${e.approvedBy.lastName} · ` : ""}
                                      {fmtDate(e.createdAt)}
                                    </p>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 tabular-nums shrink-0">
                                    {money(e.amount)}
                                  </span>
                                  {canFund && (
                                    <button onClick={() => setDeleting(e)} title="Remove"
                                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
                                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Campaigns drawing on it */}
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            Campaigns drawing on this budget
                          </p>
                          {ledger.campaigns.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No campaigns on this project yet.</p>
                          ) : (
                            <div className="flex flex-col">
                              {ledger.campaigns.map((c) => {
                                const Icon = LucideIcons[c.type?.icon] || Megaphone;
                                const pct = c.budgetAllocated > 0 ? Math.min(100, (c.spend / c.budgetAllocated) * 100) : 0;
                                return (
                                  <div key={c.id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{c.name}</p>
                                      <p className="text-[11px] text-slate-400">
                                        {money(c.spend)} of {money(c.budgetAllocated)} · {pct.toFixed(0)}%
                                      </p>
                                    </div>
                                    <Badge value={c.status} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Position */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          {[
                            ["Funded", ledger.budget.funded],
                            ["Allocated", ledger.budget.allocated],
                            ["Spent", ledger.budget.spent],
                            ["Unallocated", ledger.budget.available],
                          ].map(([label, value]) => (
                            <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> {label}
                              </p>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-50 tabular-nums">{money(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={removeEntry}
        title="Remove funding entry"
        message={`Remove ${money(deleting?.amount)} (${SOURCE_LABEL[deleting?.source] || ""})? This is refused if campaigns already rely on it.`}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
