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
  Users2,
  Loader2,
  FolderKanban,
  Crown,
} from "lucide-react";
import { getTeams, deleteTeam } from "@/actions/teams.action";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

export default function TeamsListContent({ initialData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(initialData?.pagination?.page || 1);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, team: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTeams = useCallback(
    (params = {}) => {
      const query = {
        page: params.page || page,
        limit: 10,
        ...(params.search !== undefined
          ? params.search
            ? { search: params.search }
            : {}
          : search
            ? { search }
            : {}),
      };

      startTransition(async () => {
        const result = await getTeams(query);
        if (result.success) {
          setData(result.data);
        }
      });
    },
    [page, search]
  );

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    fetchTeams({ search: val, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchTeams({ page: newPage });
  };

  const handleDelete = async () => {
    if (!deleteModal.team) return;
    setIsDeleting(true);
    const result = await deleteTeam(deleteModal.team.id);
    setIsDeleting(false);
    setDeleteModal({ open: false, team: null });

    if (result.success) {
      showToast("success", "Team deleted successfully");
      fetchTeams({ page: 1 });
      setPage(1);
    } else {
      showToast("error", result.error || "Failed to delete team");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Team",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(row.name?.[0] || "T").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50 text-sm">
              {row.name || "Unnamed Team"}
            </p>
            {row.description && (
              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                {row.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "lead",
      label: "Team Lead",
      render: (value) =>
        value ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {(value.firstName?.[0] || "").toUpperCase()}
            </div>
            <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">
              {value.firstName} {value.lastName}
            </span>
            <Crown className="w-3 h-3 text-amber-500" />
          </div>
        ) : (
          <span className="text-slate-400 text-sm">Unassigned</span>
        ),
    },
    {
      key: "members",
      label: "Members",
      render: (_, row) => {
        const count = row._count?.members || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Users2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-slate-600 dark:text-slate-400 text-sm">
              {count} {count === 1 ? "member" : "members"}
            </span>
          </div>
        );
      },
    },
    {
      key: "projectTeams",
      label: "Projects",
      render: (_, row) => {
        const count = row._count?.projectTeams || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-slate-600 dark:text-slate-400 text-sm">
              {count} {count === 1 ? "project" : "projects"}
            </span>
          </div>
        );
      },
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
            href={`/admin/teams/${row.id}`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            title="View Details"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/teams/${row.id}/edit`}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            title="Edit"
            onClick={(e) => e.stopPropagation()}
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ open: true, team: row });
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
        title="Teams"
        description="Manage your teams and assign them to projects."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Teams" },
        ]}
        actions={
          <Link
            href="/admin/teams/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Team
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
              placeholder="Search by team name..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>
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
          data={data?.teams || []}
          pagination={data?.pagination}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/admin/teams/${row.id}`)}
          emptyMessage="No teams found. Create your first team to get started!"
          emptyIcon={Users2}
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, team: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Team"
        message={`Are you sure you want to delete "${deleteModal.team?.name}"? This will remove all member assignments. This action cannot be undone.`}
        confirmLabel="Delete Team"
        variant="danger"
      />
    </div>
  );
}
