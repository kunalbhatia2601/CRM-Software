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
  FolderKanban,
  Loader2,
} from "lucide-react";

import { getProjects, deleteProject } from "@/actions/projects.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "DUE_SIGNING", label: "Due Signing" },
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const BILLING_CYCLES = [
  { value: "", label: "All Billing" },
  { value: "ONE_TIME", label: "One Time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "SEMI_ANNUAL", label: "Semi Annual" },
  { value: "ANNUAL", label: "Annual" },
];

export default function ProjectsListContent({ initialData }) {
  const router = useRouter();
  const { format } = useSite();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [page, setPage] = useState(initialData?.pagination?.page || 1);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, project: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProjects = useCallback(
    (params = {}) => {
      const query = {
        page: params.page || page,
        limit: 10,
        ...(params.search !== undefined ? { search: params.search } : search ? { search } : {}),
        ...(params.status !== undefined ? (params.status ? { status: params.status } : {}) : status ? { status } : {}),
        ...(params.billingCycle !== undefined ? (params.billingCycle ? { billingCycle: params.billingCycle } : {}) : billingCycle ? { billingCycle } : {}),
      };

      startTransition(async () => {
        const result = await getProjects(query);
        if (result.success) {
          setData(result.data);
        }
      });
    },
    [page, search, status, billingCycle]
  );

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    fetchProjects({ search: val, page: 1 });
  };

  const handleFilter = (e) => {
    const val = e.target.value;
    setStatus(val);
    setPage(1);
    fetchProjects({ status: val, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchProjects({ page: newPage });
  };

  const handleDelete = async () => {
    if (!deleteModal.project) return;
    setIsDeleting(true);
    const result = await deleteProject(deleteModal.project.id);
    setIsDeleting(false);
    setDeleteModal({ open: false, project: null });

    if (result.success) {
      showToast("success", "Project deleted successfully");
      fetchProjects({ page: 1 });
      setPage(1);
    } else {
      showToast("error", result.error || "Failed to delete project");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Project / Client",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(row.name?.[0] || "").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">{row.name}</p>
            <p className="text-xs text-slate-400">{row.client?.companyName || "—"}</p>
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
      key: "accountManager",
      label: "Manager",
      render: (val) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">
          {val ? `${val.firstName} ${val.lastName}` : "Unassigned"}
        </span>
      ),
    },
    {
      key: "billingCycle",
      label: "Billing",
      render: (val) => <Badge value={val || "ONE_TIME"} />,
    },
    {
      key: "budget",
      label: "Budget",
      render: (val) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm" suppressHydrationWarning>
          {val ? format(Number(val), { decimals: 0 }) : "—"}
        </span>
      ),
    },
    {
      key: "startDate",
      label: "Timeline",
      render: (_, row) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {row.startDate
            ? new Date(row.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
            : "—"}
          {row.endDate && (
            <> → {new Date(row.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
          )}
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
            href={`/owner/projects/${row.id}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="View Details"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/owner/projects/${row.id}/edit`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            title="Edit"
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil className="w-4 h-4" />
          </Link>
          {["NOT_STARTED", "CANCELLED"].includes(row.status) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteModal({ open: true, project: row });
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
        title="Projects"
        description="Track and manage all client projects."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Projects" },
        ]}
        actions={
          <Link
            href="/owner/projects/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        }
      />

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by project name or client..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>

          <select
            value={status}
            onChange={handleFilter}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[150px]"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={billingCycle}
            onChange={(e) => {
              const val = e.target.value;
              setBillingCycle(val);
              setPage(1);
              fetchProjects({ billingCycle: val, page: 1 });
            }}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[150px]"
          >
            {BILLING_CYCLES.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
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
          data={data?.projects || []}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/owner/projects/${row.id}`)}
          emptyMessage="No projects found. Create your first project to get started!"
          emptyIcon={FolderKanban}
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, project: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteModal.project?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        variant="danger"
      />
    </div>
  );
}
