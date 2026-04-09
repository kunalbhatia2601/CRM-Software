"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Handshake,
  Loader2,
} from "lucide-react";

import { getDeals, deleteDeal } from "@/actions/deals.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

const STAGES = [
  { value: "", label: "All Stages" },
  { value: "DISCOVERY", label: "Discovery" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

export default function DealsListContent({ initialData }) {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [page, setPage] = useState(initialData?.pagination?.page || 1);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, deal: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDeals = useCallback(
    (params = {}) => {
      const query = {
        page: params.page || page,
        limit: 10,
        ...(params.search !== undefined ? { search: params.search } : search ? { search } : {}),
        ...(params.stage !== undefined ? (params.stage ? { stage: params.stage } : {}) : stage ? { stage } : {}),
      };

      startTransition(async () => {
        const result = await getDeals(query);
        if (result.success) setData(result.data);
      });
    },
    [page, search, stage]
  );

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    fetchDeals({ search: val, page: 1 });
  };

  const handleStageChange = (e) => {
    const val = e.target.value;
    setStage(val);
    setPage(1);
    fetchDeals({ stage: val, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchDeals({ page: newPage });
  };

  const handleDelete = async () => {
    if (!deleteModal.deal) return;
    setIsDeleting(true);
    const result = await deleteDeal(deleteModal.deal.id);
    setIsDeleting(false);
    setDeleteModal({ open: false, deal: null });

    if (result.success) {
      showToast("success", "Deal deleted and lead reverted to qualified");
      fetchDeals({ page: 1 });
      setPage(1);
    } else {
      showToast("error", result.error || "Failed to delete deal");
    }
  };

  const columns = [
    {
      key: "title",
      label: "Deal",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
            row.stage === "WON" ? "bg-gradient-to-br from-emerald-400 to-green-500"
              : row.stage === "LOST" ? "bg-gradient-to-br from-red-400 to-rose-500"
                : "bg-gradient-to-br from-indigo-400 to-purple-500"
          }`}>
            {(row.title?.[0] || "").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{row.title}</p>
            <p className="text-xs text-slate-400">{row.lead?.companyName || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "stage",
      label: "Stage",
      render: (val) => <Badge value={val} />,
    },
    {
      key: "value",
      label: "Value",
      align: "right",
      render: (val) => (
        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium" suppressHydrationWarning>
          {val ? format(val, { decimals: 0 }) : "—"}
        </span>
      ),
    },
    {
      key: "assignee",
      label: "Assignee",
      render: (val) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">
          {val ? `${val.firstName} ${val.lastName}` : "Unassigned"}
        </span>
      ),
    },
    {
      key: "expectedCloseAt",
      label: "Expected Close",
      render: (val) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {val
            ? new Date(val).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {val
            ? new Date(val).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/sales/deals/${row.id}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="View"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-4 h-4" />
          </Link>
          {!["WON"].includes(row.stage) && (
            <Link
              href={`/sales/deals/${row.id}/edit`}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              title="Edit"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="w-4 h-4" />
            </Link>
          )}
          {["DISCOVERY", "LOST"].includes(row.stage) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ open: true, deal: row });
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Deals"
        description="Track and manage your active deals and pipeline."
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Deals" },
        ]}
        actions={
          <Link
            href="/sales/deals/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </Link>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by deal title or company..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>
          <select
            value={stage}
            onChange={handleStageChange}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[160px]"
          >
            {STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        {isPending && (
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <DataTable
          columns={columns}
          data={data?.deals || []}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/sales/deals/${row.id}`)}
          emptyMessage="No deals found. Convert a qualified lead to get started!"
          emptyIcon={Handshake}
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, deal: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deleteModal.deal?.title}"? The lead will be reverted back to Qualified status.`}
        confirmLabel="Delete Deal"
        variant="danger"
      />
    </div>
  );
}
