"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Boxes } from "lucide-react";
import { getPackages, deletePackage } from "@/actions/packages.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

export default function PackagesListContent({ initialData }) {
  const router = useRouter();
  const { format } = useSite();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, pkg: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleLoad = useCallback(
    (newPage = 1) => {
      startTransition(async () => {
        const result = await getPackages({
          page: newPage,
          limit: 10,
          search: search || undefined,
          isActive: isActive ? isActive : undefined,
        });
        if (result.success) setData(result.data);
        else setToast({ type: "error", message: result.error || "Failed to load packages" });
      });
    },
    [search, isActive]
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => handleLoad(1), 350);
    return () => clearTimeout(t);
  }, [search, isActive, handleLoad]);

  const handleDeleteClick = (pkg) => setDeleteModal({ open: true, pkg });

  const handleDelete = async () => {
    if (!deleteModal.pkg) return;
    setIsDeleting(true);
    const result = await deletePackage(deleteModal.pkg.id);
    if (result.success) {
      setToast({ type: "success", message: "Package deleted successfully" });
      setDeleteModal({ open: false, pkg: null });
      handleLoad(1);
    } else {
      setToast({ type: "error", message: result.error || "Failed to delete package" });
    }
    setIsDeleting(false);
  };

  const columns = [
    {
      key: "name",
      label: "Package",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {val?.charAt(0).toUpperCase() || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{val}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md" title={row.description || undefined}>
              {row.description || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "items",
      label: "Services",
      render: (val) => {
        const items = Array.isArray(val) ? val : [];
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {items.length > 0 ? `${items.length} service${items.length !== 1 ? "s" : ""}` : "—"}
          </span>
        );
      },
    },
    {
      key: "total",
      label: "Total Price",
      render: (_val, row) => {
        const items = Array.isArray(row.items) ? row.items : [];
        const total = items.reduce((sum, i) => sum + Number(i.effectivePrice || 0) * (i.quantity || 1), 0);
        return (
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
            {format(total)}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (val) => <Badge value={val ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      label: "",
      render: (_val, row) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/packages/${row.id}/edit`}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Edit package"
          >
            <Pencil size={18} />
          </Link>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete package"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const packages = data?.packages || [];
  const pagination = data?.pagination || {};

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Packages"
        description="Bundle services into named plans — Gold, Silver — that add every service in one step."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Packages" },
        ]}
        actions={
          <Link
            href="/admin/packages/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white rounded-lg hover:bg-[#4435cc] transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            New Package
          </Link>
        }
      />

      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#5542F6] focus:ring-1 focus:ring-[#5542F6] text-sm"
            />
          </div>
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#5542F6] focus:ring-1 focus:ring-[#5542F6] text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div
        className={`bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none transition-opacity ${
          isPending ? "opacity-60" : "opacity-100"
        }`}
      >
        <DataTable
          columns={columns}
          data={packages}
          pagination={pagination}
          onPageChange={handleLoad}
          onRowClick={(row) => router.push(`/admin/packages/${row.id}/edit`)}
          emptyMessage="No packages yet. Bundle your services into a plan to get started!"
          emptyIcon={Boxes}
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, pkg: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Package"
        message={`Are you sure you want to delete "${deleteModal.pkg?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Package"
        variant="danger"
      />
    </div>
  );
}
