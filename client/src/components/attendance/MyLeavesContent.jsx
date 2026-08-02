"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, XCircle, CheckCircle2, Clock, Calendar, FileText, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import LeaveBalanceCards from "@/components/attendance/LeaveBalanceCards";
import LeaveRequestForm from "@/components/attendance/LeaveRequestForm";
import { getMyLeaveRequests, listLeaveTypes, getMyLeaveBalances, cancelLeaveRequest } from "@/actions/leave.action";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function dayTypeLabel(type) {
  if (type === "FIRST_HALF") return "1st half";
  if (type === "SECOND_HALF") return "2nd half";
  return null;
}

export default function MyLeavesContent({ initialRequests = [], initialTypes = [], initialBalances = [] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [types, setTypes] = useState(initialTypes);
  const [balances, setBalances] = useState(initialBalances);
  const [formOpen, setFormOpen] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const refresh = useCallback(async () => {
    const [reqRes, typeRes, balRes] = await Promise.all([
      getMyLeaveRequests(),
      listLeaveTypes(),
      getMyLeaveBalances(),
    ]);
    if (reqRes.success) setRequests(reqRes.data);
    if (typeRes.success) setTypes(typeRes.data);
    if (balRes.success) setBalances(balRes.data);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    const res = await cancelLeaveRequest(cancelId);
    setCancelling(false);
    if (res.success) {
      showToast("success", "Leave request cancelled");
      setCancelId(null);
      refresh();
    } else {
      showToast("error", res.error || "Failed to cancel");
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");
  const approved = requests.filter((r) => r.status === "APPROVED");
  const past = requests.filter((r) => r.status === "REJECTED" || r.status === "CANCELLED");

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Leaves</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Apply for leave and track your requests.</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4]"
        >
          <Plus className="w-4 h-4" /> Apply for Leave
        </button>
      </div>

      {/* Balance cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-3">Balance — {new Date().getFullYear()}</h2>
        <LeaveBalanceCards balances={balances} />
      </div>

      {/* Pending */}
      <Section title="Pending" count={pending.length} icon={Clock} iconColor="text-amber-500">
        {pending.length === 0 ? (
          <EmptyRow message="No pending leave requests." />
        ) : (
          pending.map((r) => (
            <LeaveRow key={r.id} request={r} showCancel onCancel={() => setCancelId(r.id)} />
          ))
        )}
      </Section>

      {/* Approved */}
      <Section title="Approved" count={approved.length} icon={CheckCircle2} iconColor="text-emerald-500">
        {approved.length === 0 ? (
          <EmptyRow message="No approved leaves yet." />
        ) : (
          approved.map((r) => (
            <LeaveRow key={r.id} request={r} showCancel onCancel={() => setCancelId(r.id)} />
          ))
        )}
      </Section>

      {/* History */}
      <Section title="History" count={past.length} icon={FileText} iconColor="text-slate-500">
        {past.length === 0 ? (
          <EmptyRow message="No rejected or cancelled requests." />
        ) : (
          past.map((r) => <LeaveRow key={r.id} request={r} />)
        )}
      </Section>

      <LeaveRequestForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => refresh()}
        leaveTypes={types}
        balances={balances}
        showToast={showToast}
      />

      <ConfirmModal
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        isPending={cancelling}
        title="Cancel leave request?"
        message="This will release the reserved days back to your balance if it was already approved."
        confirmLabel="Cancel request"
        variant="danger"
      />
    </div>
  );
}

function Section({ title, count, icon: Icon, iconColor, children }) {
  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
          <span className="text-xs text-slate-400">({count})</span>
        </h2>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
    </div>
  );
}

function EmptyRow({ message }) {
  return <div className="px-5 py-6 text-center text-sm text-slate-400">{message}</div>;
}

function LeaveRow({ request, showCancel, onCancel }) {
  const dt1 = dayTypeLabel(request.fromDayType);
  const dt2 = dayTypeLabel(request.toDayType);

  return (
    <div className="px-5 py-4 flex items-start gap-4">
      <div
        className="w-1 self-stretch rounded-full"
        style={{ backgroundColor: request.leaveType?.color || "#94a3b8" }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{request.leaveType?.name}</h4>
          <Badge value={request.status} />
          <span className="text-xs text-slate-400">
            {formatDate(request.fromDate)}{dt1 ? ` (${dt1})` : ""}
            {" → "}
            {formatDate(request.toDate)}{dt2 ? ` (${dt2})` : ""}
            {" · "}
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {request.totalDays} day{request.totalDays !== 1 ? "s" : ""}
            </span>
          </span>
        </div>
        {request.reason && (
          <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{request.reason}</p>
        )}
        {request.reviewNotes && (
          <p className="text-xs text-slate-400 italic mt-1">Reviewer: {request.reviewNotes}</p>
        )}
      </div>
      {showCancel && ["PENDING", "APPROVED"].includes(request.status) && (
        <button
          onClick={onCancel}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Cancel request"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
