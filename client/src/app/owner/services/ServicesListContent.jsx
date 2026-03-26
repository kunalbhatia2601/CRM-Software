"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Eye, Pencil, Trash2, PackageCheck, Loader2 } from "lucide-react";
import { getServices, deleteService } from "@/actions/services.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

export default function ServicesListContent({ initialData }) {
  const router = useRouter();
  const { format } = useSite();

  // State management
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, service: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Transitions
  const [isPending, startTransition] = useTransition();

  // Load services with filters
  const handleLoadServices = useCallback(
    (newPage = 1) => {
      startTransition(async () => {
        const result = await getServices({
          page: newPage,
          limit: 10,
          search: search || undefined,
          isActive: isActive ? isActive : undefined,
        });

        if (result.success) {
          setData(result.data);
          setPage(newPage);
        } else {
          setToast({
            type: "error",
            message: result.error || "Failed to load services",
          });
        }
      });
    },
    [search, isActive]
  );

  // Handle page change
  const handlePageChange = (newPage) => {
    handleLoadServices(newPage);
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setIsActive(e.target.value);
    setPage(1);
  };

  // Handle delete
  const handleDeleteClick = (service) => {
    setDeleteModal({ open: true, service });
  };

  const handleDelete = async () => {
    if (!deleteModal.service) return;

    setIsDeleting(true);
    const result = await deleteService(deleteModal.service.id);

    if (result.success) {
      setToast({
        type: "success",
        message: "Service deleted successfully",
      });
      setDeleteModal({ open: false, service: null });
      handleLoadServices(1);
    } else {
      setToast({
        type: "error",
        message: result.error || "Failed to delete service",
      });
    }
    setIsDeleting(false);
  };

  // Define columns
  const columns = [
    {
      key: "name",
      label: "Service",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          >
            {val?.charAt(0).toUpperCase() || "S"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{val}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{row.description || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (val, row) => (
        <div className="flex flex-col">
          {row.salePrice ? (
            <>
              <span className="text-sm font-semibold text-emerald-600" suppressHydrationWarning>
                {format(Number(row.salePrice))}
              </span>
              <span className="text-xs text-slate-400 line-through" suppressHydrationWarning>
                {format(Number(val))}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300" suppressHydrationWarning>
              {format(Number(val))}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "points",
      label: "Includes",
      render: (val) => {
        const items = Array.isArray(val) ? val : [];
        const count = items.length;
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {count > 0 ? `${count} item${count !== 1 ? "s" : ""}` : "—"}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: "Status",
      render: (val) => (
        <Badge value={val ? "ACTIVE" : "INACTIVE"} />
      ),
    },
    {
      key: "actions",
      label: "",
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/owner/services/${row.id}`)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="View details"
          >
            <Eye size={18} />
          </button>
          <Link
            href={`/owner/services/${row.id}/edit`}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Edit service"
          >
            <Pencil size={18} />
          </Link>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete service"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  // Apply search and filter to data (debounced via transition)
  const filteredData = {
    services: data?.services || [],
    pagination: data?.pagination || {},
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && (
        <Toast
          toast={toast}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Services"
        description="Manage your agency's service offerings."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Services" },
        ]}
        actions={
          <Link
            href="/owner/services/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white rounded-lg hover:bg-[#4435cc] transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            New Service
          </Link>
        }
      />

      {/* Filter Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#5542F6] focus:ring-1 focus:ring-[#5542F6] text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={isActive}
            onChange={handleFilterChange}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#5542F6] focus:ring-1 focus:ring-[#5542F6] text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <DataTable
          columns={columns}
          data={filteredData.services}
          pagination={filteredData.pagination}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/owner/services/${row.id}`)}
          emptyMessage="No services found. Create your first service to get started!"
          emptyIcon={PackageCheck}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, service: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteModal.service?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Service"
        variant="danger"
      />
    </div>
  );
}
