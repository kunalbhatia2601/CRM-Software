"use client";

import { useState, useEffect, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import {
  Plus, Loader2, Receipt, Check, X, Wallet, Paperclip, ChevronDown, ChevronUp,
  Clock, AlertCircle, Search,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { useSite } from "@/context/SiteContext";
import ExpenseForm from "./ExpenseForm";
import {
  getExpenses, getMyExpenses, approveExpense, rejectExpense, payExpense, cancelExpense,
} from "@/actions/expenses.action";

const APPROVER_ROLES = ["OWNER", "ADMIN"];
const PAYER_ROLES = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

const TABS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "PAID", label: "Paid" },
  { id: "REJECTED", label: "Rejected" },
  { id: "DRAFT", label: "Drafts" },
];

const PAY_MODES = ["BANK_TRANSFER", "UPI", "CASH", "CARD", "COMPANY_CARD", "OTHER"];

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] outline-none";

/**
 * Expense list, claim form and approval queue in one screen.
 *
 * @param {string}  basePath  role base, e.g. "/owner"
 * @param {boolean} scopeMine true = only the signed-in user's claims
 */
export default function ExpensesContent({ basePath = "/owner", scopeMine = false }) {
  const { user } = useAuth();
  const { format } = useSite();

  const canApprove = APPROVER_ROLES.includes(user?.role);
  const canPay = PAYER_ROLES.includes(user?.role);
  const selfApproving = canApprove;

  const [data, setData] = useState({ expenses: [], totalAmount: 0, pagination: {} });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(canApprove && !scopeMine ? "PENDING" : "ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [rejectModal, setRejectModal] = useState({ open: false, expense: null, note: "" });
  const [payModal, setPayModal] = useState({ open: false, expense: null, mode: "BANK_TRANSFER", ref: "" });
  const [cancelModal, setCancelModal] = useState({ open: false, expense: null });

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (tab !== "ALL") params.status = tab;
    if (search.trim()) params.search = search.trim();
    const res = scopeMine ? await getMyExpenses(params) : await getExpenses(params);
    if (res.success) setData(res.data);
    else setToast({ type: "error", message: res.error });
    setLoading(false);
  }, [tab, search, scopeMine]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const replace = (updated) =>
    setData((p) => ({ ...p, expenses: p.expenses.map((e) => (e.id === updated.id ? updated : e)) }));

  const act = async (id, fn, okMsg) => {
    setBusyId(id);
    const res = await fn();
    setBusyId(null);
    if (res.success) {
      replace(res.data);
      setToast({ type: "success", message: okMsg });
    } else {
      setToast({ type: "error", message: res.error });
    }
    return res.success;
  };

  // ── Create / edit ──
  if (creating || editing) {
    return (
      <div className="p-6 space-y-6">
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
        <PageHeader
          title={editing ? "Edit expense" : selfApproving ? "Record expense" : "New expense claim"}
          description={
            editing
              ? "Update the details and resubmit."
              : selfApproving
                ? "Recorded directly — no approval needed."
                : "Submit for approval. You will be notified once it is reviewed."
          }
          breadcrumbs={[
            { label: "Expenses", href: `${basePath}/expenses` },
            { label: editing ? "Edit" : "New" },
          ]}
        />
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <ExpenseForm
            expense={editing}
            selfApproving={selfApproving}
            onCancel={() => { setCreating(false); setEditing(null); }}
            onSaved={() => {
              setCreating(false);
              setEditing(null);
              setToast({ type: "success", message: "Expense saved" });
              load();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title={scopeMine ? "My Expenses" : "Expenses"}
        description={
          scopeMine
            ? "Everything you have claimed, and where it stands."
            : "Claims, approvals and reimbursements."
        }
        breadcrumbs={[{ label: "Dashboard", href: `${basePath}/dashboard` }, { label: "Expenses" }]}
        actions={
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {selfApproving ? "Record Expense" : "New Claim"}
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              dir="ltr"
              className={`${inputClass} pl-9`}
              placeholder="Search title or reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tab === t.id
                  ? "bg-[#5542F6] text-white border-[#5542F6]"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-[#5542F6]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Total for the current filter */}
      {data.expenses.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Wallet className="w-4 h-4 text-[#5542F6]" />
          {data.pagination?.total ?? data.expenses.length} expense
          {(data.pagination?.total ?? data.expenses.length) === 1 ? "" : "s"} ·
          <span className="font-bold text-slate-900 dark:text-slate-50">
            {format(data.totalAmount || 0, { decimals: 0 })}
          </span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : data.expenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            {tab === "ALL" ? "No expenses yet." : `No ${tab.toLowerCase()} expenses.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.expenses.map((e) => {
            const Icon = LucideIcons[e.category?.icon] || Receipt;
            const open = expandedId === e.id;
            const isMine = e.submittedById === user?.id;
            const files = Array.isArray(e.attachments) ? e.attachments : [];
            const fields = Array.isArray(e.category?.fieldSchema) ? e.category.fieldSchema : [];

            return (
              <div
                key={e.id}
                className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 transition-all ${
                  open ? "border-[#5542F6] shadow-md" : "border-slate-200 dark:border-slate-800 hover:shadow-sm"
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedId(open ? null : e.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setExpandedId(open ? null : e.id); }
                  }}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#5542F6]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">{e.title}</h3>
                      <Badge value={e.status} />
                      {e.isBillable && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20">
                          Billable
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono">{e.reference}</span>
                      <span>· {e.category?.name}</span>
                      <span>· {fmtDate(e.expenseDate)}</span>
                      {!scopeMine && e.submittedBy && (
                        <span>· {e.submittedBy.firstName} {e.submittedBy.lastName}</span>
                      )}
                      {files.length > 0 && (
                        <span className="inline-flex items-center gap-1">
                          · <Paperclip className="w-3 h-3" /> {files.length}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50 tabular-nums">
                      {format(Number(e.totalAmount) || 0, { decimals: 0 })}
                    </p>
                    {open ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 ml-auto mt-1" />
                    )}
                  </div>
                </div>

                {open && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    {e.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{e.description}</p>
                    )}

                    {/* Category answers */}
                    {fields.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                        {fields.map((f) => {
                          const v = e.formData?.[f.id];
                          if (v === undefined || v === null || v === "") return null;
                          return (
                            <div key={f.id} className="flex items-baseline justify-between gap-3">
                              <span className="text-xs text-slate-500">{f.label}</span>
                              <span className="text-xs font-medium text-slate-900 dark:text-slate-50 text-right">{String(v)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Receipts */}
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {files.map((f, i) => (
                          <a
                            key={i} href={f.url} target="_blank" rel="noreferrer"
                            onClick={(ev) => ev.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-indigo-600 hover:underline"
                          >
                            <Paperclip className="w-3 h-3" /> {f.name}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Money breakdown */}
                    <div className="grid sm:grid-cols-3 gap-3 text-xs">
                      <div><span className="text-slate-400">Amount</span><p className="font-semibold text-slate-900 dark:text-slate-50">{format(Number(e.amount) || 0, { decimals: 2 })}</p></div>
                      {Number(e.taxAmount) > 0 && (
                        <div><span className="text-slate-400">Tax</span><p className="font-semibold text-slate-900 dark:text-slate-50">{format(Number(e.taxAmount), { decimals: 2 })}</p></div>
                      )}
                      {e.project && (
                        <div><span className="text-slate-400">Project</span><p className="font-semibold text-slate-900 dark:text-slate-50">{e.project.name}</p></div>
                      )}
                    </div>

                    {e.reviewNotes && (
                      <p className="text-xs px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                        <b>Review note:</b> {e.reviewNotes}
                      </p>
                    )}

                    {/* Timeline */}
                    {e.events?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> History
                        </p>
                        <div className="space-y-1.5">
                          {e.events.map((ev) => (
                            <div key={ev.id} className="flex items-center gap-2 text-xs">
                              <Badge value={ev.statusAfter} />
                              <span className="text-slate-500">
                                {ev.actor ? `${ev.actor.firstName} ${ev.actor.lastName}` : "System"}
                              </span>
                              {ev.note && <span className="text-slate-400 truncate">— {ev.note}</span>}
                              <span className="text-slate-400 ml-auto shrink-0">{fmtDate(ev.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {canApprove && e.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => act(e.id, () => approveExpense(e.id), "Expense approved")}
                            disabled={busyId === e.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {busyId === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, expense: e, note: "" })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      )}

                      {canPay && e.status === "APPROVED" && e.isReimbursable && (
                        <button
                          onClick={() => setPayModal({ open: true, expense: e, mode: "BANK_TRANSFER", ref: "" })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-lg hover:bg-[#4636d4]"
                        >
                          <Wallet className="w-3.5 h-3.5" /> Mark paid
                        </button>
                      )}

                      {isMine && ["DRAFT", "PENDING", "REJECTED"].includes(e.status) && (
                        <button
                          onClick={() => setEditing(e)}
                          className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          Edit
                        </button>
                      )}

                      {isMine && !["PAID", "CANCELLED"].includes(e.status) && (
                        <button
                          onClick={() => setCancelModal({ open: true, expense: e })}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-600"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject — a reason is mandatory */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Reject expense</h3>
            <p className="text-xs text-slate-400 mt-0.5">{rejectModal.expense?.reference} · {rejectModal.expense?.title}</p>
            <textarea
              dir="ltr" rows={3} autoFocus
              className={`${inputClass} mt-4`}
              placeholder="Why is this being rejected? The claimant will see this."
              value={rejectModal.note}
              onChange={(ev) => setRejectModal({ ...rejectModal, note: ev.target.value })}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setRejectModal({ open: false, expense: null, note: "" })}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl">
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!rejectModal.note.trim()) return;
                  const okDone = await act(rejectModal.expense.id, () => rejectExpense(rejectModal.expense.id, rejectModal.note.trim()), "Expense rejected");
                  if (okDone) setRejectModal({ open: false, expense: null, note: "" });
                }}
                disabled={!rejectModal.note.trim()}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark paid */}
      {payModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Mark as paid</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {payModal.expense?.reference} · {format(Number(payModal.expense?.totalAmount) || 0, { decimals: 2 })}
            </p>
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Paid via</label>
                <select className={inputClass} value={payModal.mode}
                  onChange={(ev) => setPayModal({ ...payModal, mode: ev.target.value })}>
                  {PAY_MODES.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Reference</label>
                <input dir="ltr" className={inputClass} placeholder="UTR / transaction id"
                  value={payModal.ref} onChange={(ev) => setPayModal({ ...payModal, ref: ev.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setPayModal({ open: false, expense: null, mode: "BANK_TRANSFER", ref: "" })}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl">
                Cancel
              </button>
              <button
                onClick={async () => {
                  const okDone = await act(
                    payModal.expense.id,
                    () => payExpense(payModal.expense.id, { paymentMode: payModal.mode, paymentRef: payModal.ref || null }),
                    "Marked as paid"
                  );
                  if (okDone) setPayModal({ open: false, expense: null, mode: "BANK_TRANSFER", ref: "" });
                }}
                className="px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]"
              >
                Mark paid
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={cancelModal.open}
        onClose={() => setCancelModal({ open: false, expense: null })}
        onConfirm={async () => {
          await act(cancelModal.expense.id, () => cancelExpense(cancelModal.expense.id), "Expense withdrawn");
          setCancelModal({ open: false, expense: null });
        }}
        title="Withdraw expense"
        message={`Withdraw "${cancelModal.expense?.title}"? It will no longer be reviewed.`}
        confirmLabel="Withdraw"
        variant="danger"
      />
    </div>
  );
}
