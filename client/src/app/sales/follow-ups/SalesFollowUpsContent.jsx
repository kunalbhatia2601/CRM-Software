"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  PhoneForwarded,
  Search,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  ListChecks,
  MoreHorizontal,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getFollowUps, updateFollowUp } from "@/actions/followups.action";
import Toast from "@/components/ui/Toast";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "SKIPPED", label: "Skipped" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "MEETING", label: "Meeting" },
  { value: "TASK", label: "Task" },
  { value: "OTHER", label: "Other" },
];

const typeIcons = { CALL: Phone, EMAIL: Mail, MEETING: CalendarIcon, TASK: ListChecks, OTHER: MoreHorizontal };

export default function SalesFollowUpsContent({ initialData }) {
  const [followUps, setFollowUps] = useState(initialData?.followUps || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [toast, setToast] = useState(null);

  const fetchFollowUps = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50, sortBy: "dueAt", sortOrder: "asc" };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const result = await getFollowUps(params);
      if (result.success) setFollowUps(result.data.followUps || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchFollowUps, 300);
    return () => clearTimeout(timer);
  }, [fetchFollowUps]);

  const handleMarkComplete = async (id) => {
    const result = await updateFollowUp(id, { status: "COMPLETED" });
    if (result.success) {
      setFollowUps((prev) => prev.map((fu) => (fu.id === id ? { ...fu, ...result.data } : fu)));
      setToast({ type: "success", message: "Follow-up marked as completed" });
    } else {
      setToast({ type: "error", message: result.error || "Failed to update" });
    }
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const isOverdue = (dueAt, status) => {
    if (status === "COMPLETED" || status === "SKIPPED") return false;
    return new Date(dueAt) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Follow-ups</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track and manage all your lead follow-ups.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search follow-ups..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none">
          {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none">
          {TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>

      {/* Follow-ups List */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : followUps.length > 0 ? (
        <div className="space-y-3">
          {followUps.map((fu) => {
            const TypeIcon = typeIcons[fu.type] || MoreHorizontal;
            const overdue = isOverdue(fu.dueAt, fu.status);

            return (
              <div
                key={fu.id}
                className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 ${
                  overdue ? "border-red-200 dark:border-red-900/50" : fu.status === "COMPLETED" ? "border-emerald-200 dark:border-emerald-900/30 opacity-70" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      overdue ? "bg-red-50 dark:bg-red-900/20" : fu.status === "COMPLETED" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      <TypeIcon className={`w-5 h-5 ${overdue ? "text-red-500" : fu.status === "COMPLETED" ? "text-emerald-500" : "text-slate-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{fu.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge value={fu.status} />
                        <Badge value={fu.type} />
                        {fu.lead && (
                          <Link href={`/sales/leads/${fu.lead.id}`} className="text-xs text-[#5542F6] hover:underline">
                            {fu.lead.companyName}
                          </Link>
                        )}
                        {overdue && (
                          <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                      {fu.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{fu.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(fu.dueAt)}</p>
                      <p className="text-xs text-slate-400">{formatTime(fu.dueAt)}</p>
                    </div>
                    {fu.status === "PENDING" && (
                      <button
                        onClick={() => handleMarkComplete(fu.id)}
                        className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                        title="Mark as completed"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <PhoneForwarded className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No follow-ups found.</p>
        </div>
      )}
    </div>
  );
}
