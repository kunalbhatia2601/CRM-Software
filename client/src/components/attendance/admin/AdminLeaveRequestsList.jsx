"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Loader2, User, FileText } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import { listLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from "@/actions/leave.action";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function dayTypeLabel(type) {
  if (type === "FIRST_HALF") return "1st half";
  if (type === "SECOND_HALF") return "2nd half";
  return null;
}

const STATUS_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "", label: "All" },
];

export default function AdminLeaveRequestsList() {
  const [status, setStatus] = useState("PENDING");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null); // { mode: 'approve'|'reject', request }
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    const res = await listLeaveRequests(params);
    if (res.success) setRequests(res.data);
    setLoading(false);
  }, [status]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleReview = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    const fn = reviewing.mode === "approve" ? approveLeaveRequest : rejectLeaveRequest;
    const res = await fn(reviewing.request.id, reviewNotes || undefined);
    setSubmitting(false);
    if (res.success) {
      showToast("success", `Request ${reviewing.mode === "approve" ? "approved" : "rejected"}`);
      setReviewing(null);
      setReviewNotes("");
      fetchRequests();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Leave Requests</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review and approve/reject leave requests.</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value || "all"}
            onClick={() => setStatus(t.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              status === t.value
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm text-slate-400">No {status.toLowerCase() || ""} leave requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const dt1 = dayTypeLabel(r.fromDayType);
            const dt2 = dayTypeLabel(r.toDayType);
            return (
              <div key={r.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: r.leaveType?.color || "#94a3b8" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-8 h-8 rounded-full bg-[#5542F6] text-white text-xs font-bold flex items-center justify-center">
                        {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {r.user?.firstName} {r.user?.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          <Badge value={r.user?.role || ""} /> · {r.user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Badge value={r.leaveType?.name || "Leave"} />
                      <Badge value={r.status} />
                      <span className="text-xs text-slate-500">
                        {formatDate(r.fromDate)}{dt1 ? ` (${dt1})` : ""}
                        {" → "}
                        {formatDate(r.toDate)}{dt2 ? ` (${dt2})` : ""}
                        {" · "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {r.totalDays} day{r.totalDays !== 1 ? "s" : ""}
                        </span>
                      </span>
                    </div>
                    {r.reason && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap">
                        {r.reason}
                      </p>
                    )}
                    {r.reviewNotes && (
                      <p className="text-xs text-slate-400 italic mt-2">
                        Reviewer notes: {r.reviewNotes}
                        {r.reviewedBy && ` — ${r.reviewedBy.firstName} ${r.reviewedBy.lastName}`}
                      </p>
                    )}
                  </div>
                  {r.status === "PENDING" && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => { setReviewing({ mode: "approve", request: r }); setReviewNotes(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => { setReviewing({ mode: "reject", request: r }); setReviewNotes(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 dark:bg-red-900/20"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setReviewing(null)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {reviewing.mode === "approve" ? "Approve" : "Reject"} Leave Request
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {reviewing.request.user?.firstName} {reviewing.request.user?.lastName} ·{" "}
                {reviewing.request.leaveType?.name} · {reviewing.request.totalDays} day{reviewing.request.totalDays !== 1 ? "s" : ""}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                Review notes {reviewing.mode === "reject" ? "(recommended)" : "(optional)"}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder={reviewing.mode === "approve" ? "Optional message to the requestor..." : "Reason for rejection..."}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setReviewing(null)}
                disabled={submitting}
                className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={submitting}
                className={`flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl disabled:opacity-50 ${
                  reviewing.mode === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {reviewing.mode === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
