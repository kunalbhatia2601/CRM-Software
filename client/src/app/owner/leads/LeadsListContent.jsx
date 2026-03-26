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
  Target,
  Loader2,
} from "lucide-react";

import { getLeads, deleteLead } from "@/actions/leads.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "UNQUALIFIED", label: "Unqualified" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
];

const SOURCES = [
  { value: "", label: "All Sources" },
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
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function LeadsListContent({ initialData }) {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(initialData?.pagination?.page || 1);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, lead: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLeads = useCallback(
    (params = {}) => {
      const query = {
        page: params.page || page,
        limit: 10,
        ...(params.search !== undefined ? { search: params.search } : search ? { search } : {}),
        ...(params.status !== undefined ? (params.status ? { status: params.status } : {}) : status ? { status } : {}),
        ...(params.source !== undefined ? (params.source ? { source: params.source } : {}) : source ? { source } : {}),
        ...(params.priority !== undefined
          ? params.priority
            ? { priority: params.priority }
            : {}
          : priority
            ? { priority }
            : {}),
      };

      startTransition(async () => {
        const result = await getLeads(query);
        if (result.success) {
          setData(result.data);
        }
      });
    },
    [page, search, status, source, priority]
  );

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    fetchLeads({ search: val, page: 1 });
  };

  const handleFilter = (setter, key) => (e) => {
    const val = e.target.value;
    setter(val);
    setPage(1);
    fetchLeads({ [key]: val, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchLeads({ page: newPage });
  };

  const handleDelete = async () => {
    if (!deleteModal.lead) return;
    setIsDeleting(true);
    const result = await deleteLead(deleteModal.lead.id);
    setIsDeleting(false);
    setDeleteModal({ open: false, lead: null });

    if (result.success) {
      showToast("success", "Lead deleted successfully");
      fetchLeads({ page: 1 });
      setPage(1);
    } else {
      showToast("error", result.error || "Failed to delete lead");
    }
  };

  const columns = [
    {
      key: "companyName",
      label: "Company / Contact",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(row.companyName?.[0] || "").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{row.companyName}</p>
            <p className="text-xs text-slate-400">{row.contactName}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <Badge value={val} />,
    },
    {
      key: "priority",
      label: "Priority",
      render: (val) => <Badge value={val} />,
    },
    {
      key: "source",
      label: "Source",
      render: (val) => <Badge value={val} />,
    },
    {
      key: "estimatedValue",
      label: "Est. Value",
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
      key: "createdAt",
      label: "Created",
      render: (val) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {val
            ? new Date(val).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
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
            href={`/owner/leads/${row.id}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="View Details"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/owner/leads/${row.id}/edit`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            title="Edit"
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil className="w-4 h-4" />
          </Link>
          {["NEW", "LOST"].includes(row.status) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ open: true, lead: row });
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
        title="Leads"
        description="Track and manage all your incoming leads and prospects."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Leads" },
        ]}
        actions={
          <Link
            href="/owner/leads/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </Link>
        }
      />

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by company, contact, or email..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={handleFilter(setStatus, "status")}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[150px]"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={source}
            onChange={handleFilter(setSource, "source")}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[150px]"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={handleFilter(setPriority, "priority")}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[150px]"
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading...
          </div>
        )}
      </div>

      {/* Data Table Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <DataTable
          columns={columns}
          data={data?.leads || []}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/owner/leads/${row.id}`)}
          emptyMessage="No leads found. Add your first lead to get started!"
          emptyIcon={Target}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, lead: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Lead"
        message={`Are you sure you want to delete the lead "${deleteModal.lead?.companyName}"? This action cannot be undone.`}
        confirmLabel="Delete Lead"
        variant="danger"
      />
    </div>
  );
}
