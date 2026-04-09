"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Eye, Pencil, Trash2, Layers, Link2 } from "lucide-react";
import { getSamples, deleteSample } from "@/actions/samples.action";
import PageHeader from "@/components/ui/PageHeader";
import DataTable from "@/components/ui/DataTable";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast from "@/components/ui/Toast";

export default function SamplesListContent({ initialData }) {
  const router = useRouter();

  // State management
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, sample: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Transitions
  const [isPending, startTransition] = useTransition();

  // Load samples with filters
  const handleLoadSamples = useCallback(
    (newPage = 1) => {
      startTransition(async () => {
        const result = await getSamples({
          page: newPage,
          limit: 10,
          search: search || undefined,
        });

        if (result.success) {
          setData(result.data);
          setPage(newPage);
        } else {
          setToast({
            type: "error",
            message: result.error || "Failed to load samples",
          });
        }
      });
    },
    [search]
  );

  // Handle page change
  const handlePageChange = (newPage) => {
    handleLoadSamples(newPage);
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
  };

  // Handle delete
  const handleDeleteClick = (sample) => {
    setDeleteModal({ open: true, sample });
  };

  const handleDelete = async () => {
    if (!deleteModal.sample) return;

    setIsDeleting(true);
    const result = await deleteSample(deleteModal.sample.id);

    if (result.success) {
      setToast({
        type: "success",
        message: "Sample deleted successfully",
      });
      setDeleteModal({ open: false, sample: null });
      handleLoadSamples(1);
    } else {
      setToast({
        type: "error",
        message: result.error || "Failed to delete sample",
      });
    }
    setIsDeleting(false);
  };

  // Define columns
  const columns = [
    {
      key: "name",
      label: "Sample",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
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
      key: "links",
      label: "Links",
      render: (val) => {
        const links = Array.isArray(val) ? val : [];
        return (
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {links.length} link{links.length !== 1 ? "s" : ""}
            </span>
          </div>
        );
      },
    },
    {
      key: "createdBy",
      label: "Created By",
      render: (val) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {val ? `${val.firstName} ${val.lastName}` : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (val) => (
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {val ? new Date(val).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/sales/samples/${row.id}`)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="View details"
          >
            <Eye size={18} />
          </button>
          <Link
            href={`/sales/samples/${row.id}/edit`}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Edit sample"
          >
            <Pencil size={18} />
          </Link>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete sample"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const filteredData = {
    samples: data?.samples || [],
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
        title="Samples"
        description="Manage your portfolio and work samples."
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Samples" },
        ]}
        actions={
          <Link
            href="/sales/samples/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white rounded-lg hover:bg-[#4435cc] transition-colors font-medium text-sm"
          >
            <Plus size={18} />
            New Sample
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
              placeholder="Search samples..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#5542F6] focus:ring-1 focus:ring-[#5542F6] text-sm"
            />
          </div>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <DataTable
          columns={columns}
          data={filteredData.samples}
          pagination={filteredData.pagination}
          onPageChange={handlePageChange}
          onRowClick={(row) => router.push(`/sales/samples/${row.id}`)}
          emptyMessage="No samples found. Create your first sample to get started!"
          emptyIcon={Layers}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, sample: null })}
        onConfirm={handleDelete}
        isPending={isDeleting}
        title="Delete Sample"
        message={`Are you sure you want to delete "${deleteModal.sample?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Sample"
        variant="danger"
      />
    </div>
  );
}
