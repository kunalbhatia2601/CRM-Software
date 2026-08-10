"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, ReceiptText, Trash2, Eye, Loader2, X, Search, FolderKanban } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";
import { useSite } from "@/context/SiteContext";
import { getInvoices, deleteInvoice } from "@/actions/invoices.action";
import { getProjects } from "@/actions/projects.action";

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-400 line-through dark:bg-slate-800",
};

export default function InvoicesListContent({ basePath, initialData }) {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();

  const [invoices, setInvoices] = useState(initialData?.invoices || []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Project picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = useCallback(() => {
    startTransition(async () => {
      const res = await getInvoices({ page: 1, limit: 50, search, status: statusFilter });
      if (res.success) setInvoices(res.data.invoices || []);
    });
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(refresh, 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const openPicker = async () => {
    setPickerOpen(true);
    setLoadingProjects(true);
    const res = await getProjects({ page: 1, limit: 100 });
    if (res.success) setProjects(res.data.projects || []);
    setLoadingProjects(false);
  };

  const pickProject = (projectId) => {
    setPickerOpen(false);
    router.push(`${basePath}/invoices/create?projectId=${projectId}`);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const res = await deleteInvoice(deletingId);
    if (res.success) {
      setInvoices((prev) => prev.filter((i) => i.id !== deletingId));
      showToast("success", "Invoice deleted");
    } else {
      showToast("error", res.error || "Failed to delete");
    }
    setDeletingId(null);
  };

  const filteredProjects = projects.filter((p) =>
    p.name?.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.client?.companyName?.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="p-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Invoices"
        description="Create and manage per-project invoices."
        actions={
          <button
            onClick={openPicker}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-colors"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice #, project, client..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 outline-none"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isPending && invoices.length === 0 ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ReceiptText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">No invoices yet.</p>
            <button onClick={openPicker} className="text-sm px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100">
              Create your first invoice
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Invoice #</th>
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Bill To</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium">Issued</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer"
                  onClick={() => router.push(`${basePath}/invoices/${inv.id}`)}
                >
                  <td className="px-5 py-3 font-mono text-slate-900 dark:text-slate-50">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{inv.project?.name || "—"}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{inv.billToName || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_STYLES[inv.status] || ""}`}>
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900 dark:text-slate-50">
                    {format(inv.total)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{new Date(inv.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => router.push(`${basePath}/invoices/${inv.id}`)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md" title="View">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                      <button onClick={() => setDeletingId(inv.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Project picker modal */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-h-screen overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPickerOpen(false)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Select a Project</h3>
              <button onClick={() => setPickerOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-[#5542F6]"
                autoFocus
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-1">
              {loadingProjects ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : filteredProjects.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No projects found.</p>
              ) : (
                filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => pickProject(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.client?.companyName || "No client"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="This permanently removes the invoice. Continue?"
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
