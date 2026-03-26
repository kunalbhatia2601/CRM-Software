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
  UsersRound,
  Loader2,
} from "lucide-react";

import { getUsers, deleteUser } from "@/actions/users.action";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

const ROLES = [
  { value: "", label: "All Roles" },
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager" },
  { value: "FINANCE_MANAGER", label: "Finance Manager" },
  { value: "HR", label: "HR" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "CLIENT", label: "Client" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "INVITED", label: "Invited" },
];

export default function UsersListContent({ initialData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(initialData?.pagination?.page || 1);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(
    (params = {}) => {
      const query = {
        page: params.page || page,
        limit: 10,
        ...(params.search !== undefined ? { search: params.search } : search ? { search } : {}),
        ...(params.role !== undefined ? (params.role ? { role: params.role } : {}) : role ? { role } : {}),
        ...(params.status !== undefined ? (params.status ? { status: params.status } : {}) : status ? { status } : {}),
      };

      startTransition(async () => {
        const result = await getUsers(query);
        if (result.success) {
          setData(result.data);
        }
      });
    },
    [page, search, role, status]
  );

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    fetchUsers({ search: val, page: 1 });
  };

  const handleRoleChange = (e) => {
    const val = e.target.value;
    setRole(val);
    setPage(1);
    fetchUsers({ role: val, page: 1 });
  };

  const handleStatusChange = (e) => {
    const val = e.target.value;
    setStatus(val);
    setPage(1);
    fetchUsers({ status: val, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchUsers({ page: newPage });
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    setIsDeleting(true);
    const result = await deleteUser(deleteModal.user.id);
    setIsDeleting(false);
    setDeleteModal({ open: false, user: null });

    if (result.success) {
      showToast("success", "User deleted successfully");
      fetchUsers({ page: 1 });
      setPage(1);
    } else {
      showToast("error", result.error || "Failed to delete user");
    }
  };

  const columns = [
    {
      key: "name",
      label: "User",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(row.firstName?.[0] || "").toUpperCase()}
            {(row.lastName?.[0] || "").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (val) => <Badge value={val} />,
    },
    {
      key: "status",
      label: "Status",
      render: (val) => <Badge value={val} />,
    },
    {
      key: "phone",
      label: "Phone",
      render: (val) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">{val || "—"}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (val) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {val ? new Date(val).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
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
            href={`/owner/users/${row.id}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="View Report"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/owner/users/${row.id}/edit`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ open: true, user: row });
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Users"
        description="Manage all team members, clients, and their access."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Users" },
        ]}
        actions={
          <Link
            href="/owner/users/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add User
          </Link>
        }
      />

      {/* Filters Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={role}
            onChange={handleRoleChange}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[160px]"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all appearance-none shadow-sm dark:shadow-none cursor-pointer min-w-[160px]"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
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
          data={data?.users || []}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/owner/users/${row.id}`)}
          emptyMessage="No users found. Add your first team member!"
          emptyIcon={UsersRound}
        />
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteModal.user?.firstName} ${deleteModal.user?.lastName}? This will permanently remove them and revoke all sessions.`}
        confirmLabel="Delete User"
        variant="danger"
      />
    </div>
  );
}
