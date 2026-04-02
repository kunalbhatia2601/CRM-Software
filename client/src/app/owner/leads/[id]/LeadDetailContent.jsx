"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Mail,
  Phone,
  Calendar,
  Clock,
  Building2,
  User,
  Target,
  DollarSign,
  FileText,
  ArrowRight,
  AlertCircle,
  CalendarClock,
  UserCheck,
  Sparkles,
  XCircle,
  CheckCircle2,
  ChevronRight,
  Handshake,
  Rocket,
} from "lucide-react";

import { updateLeadStatus, getAssignableUsers } from "@/actions/leads.action";
import { createDeal } from "@/actions/deals.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import MeetingsSection from "@/components/meetings/MeetingsSection";
import FollowUpsSection from "@/components/followups/FollowUpsSection";
import SamplesSection from "@/components/samples/SamplesSection";

/* ─── Status flow config ─── */
const STATUS_TRANSITIONS = {
  NEW: ["CONTACTED", "QUALIFIED", "UNQUALIFIED", "LOST"],
  CONTACTED: ["QUALIFIED", "UNQUALIFIED", "LOST"],
  QUALIFIED: ["LOST"], // CONVERTED removed — handled via Create Deal modal
  UNQUALIFIED: ["NEW", "CONTACTED", "LOST"],
  CONVERTED: [],
  LOST: ["NEW"],
};

const STATUS_COLORS = {
  NEW: "from-blue-500 to-indigo-600",
  CONTACTED: "from-sky-500 to-blue-600",
  QUALIFIED: "from-emerald-500 to-green-600",
  UNQUALIFIED: "from-amber-500 to-orange-600",
  CONVERTED: "from-green-500 to-emerald-600",
  LOST: "from-red-500 to-rose-600",
};

const STATUS_ICONS = {
  NEW: Sparkles,
  CONTACTED: Phone,
  QUALIFIED: CheckCircle2,
  UNQUALIFIED: AlertCircle,
  CONVERTED: Target,
  LOST: XCircle,
};

/* ─── Status Pipeline Steps ─── */
const PIPELINE_STEPS = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED"];

function getStepIndex(status) {
  if (status === "LOST" || status === "UNQUALIFIED") return -1;
  return PIPELINE_STEPS.indexOf(status);
}

export default function LeadDetailContent({ initialLead, initialMeetings = [], initialFollowUps = [], initialSamples = [] }) {
  const router = useRouter();
  const { format, formatCompact } = useSite();
  const [lead, setLead] = useState(initialLead);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [lostReasonInput, setLostReasonInput] = useState("");
  const [showLostModal, setShowLostModal] = useState(false);

  // Convert to Deal modal state
  const [showDealModal, setShowDealModal] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [dealForm, setDealForm] = useState({
    title: "",
    value: "",
    assigneeId: "",
    expectedCloseAt: "",
    notes: "",
  });

  // Load assignees when deal modal opens
  useEffect(() => {
    if (showDealModal && assignees.length === 0) {
      getAssignableUsers().then(setAssignees);
    }
  }, [showDealModal]);

  // Pre-fill deal form when modal opens
  useEffect(() => {
    if (showDealModal) {
      setDealForm({
        title: `${lead.companyName} — Deal`,
        value: lead.estimatedValue || "",
        assigneeId: lead.assigneeId || "",
        expectedCloseAt: "",
        notes: "",
      });
    }
  }, [showDealModal]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === "LOST") {
      setShowLostModal(true);
      return;
    }

    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, newStatus);
      if (result.success) {
        setLead(result.data);
        showToast("success", `Lead status updated to ${newStatus}`);
      } else {
        showToast("error", result.error || "Failed to update status");
      }
    });
  };

  const handleLostConfirm = () => {
    if (!lostReasonInput.trim()) {
      showToast("error", "Please provide a reason for marking this lead as lost");
      return;
    }

    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, "LOST", lostReasonInput.trim());
      if (result.success) {
        setLead(result.data);
        setShowLostModal(false);
        setLostReasonInput("");
        showToast("success", "Lead marked as lost");
      } else {
        showToast("error", result.error || "Failed to update status");
      }
    });
  };

  const handleCreateDeal = () => {
    if (!dealForm.title.trim()) {
      showToast("error", "Deal title is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        leadId: lead.id,
        title: dealForm.title.trim(),
      };
      if (dealForm.value) payload.value = parseFloat(dealForm.value);
      if (dealForm.assigneeId) payload.assigneeId = dealForm.assigneeId;
      if (dealForm.expectedCloseAt) payload.expectedCloseAt = dealForm.expectedCloseAt;
      if (dealForm.notes) payload.notes = dealForm.notes;

      const result = await createDeal(payload);
      if (result.success) {
        setShowDealModal(false);
        showToast("success", "Deal created! Redirecting...");
        // Redirect to the new deal
        setTimeout(() => {
          router.push(`/owner/deals/${result.data.id}`);
        }, 1000);
      } else {
        showToast("error", result.error || "Failed to create deal");
      }
    });
  };

  const allowedTransitions = STATUS_TRANSITIONS[lead.status] || [];
  const StatusIcon = STATUS_ICONS[lead.status] || Target;
  const currentStepIdx = getStepIndex(lead.status);

  const createdDate = lead.createdAt
    ? new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const followUpDate = lead.followUpAt
    ? new Date(lead.followUpAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const convertedDate = lead.convertedAt
    ? new Date(lead.convertedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Lead Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Leads", href: "/owner/leads" },
          { label: lead.companyName },
        ]}
        actions={
          lead.status !== "CONVERTED" ? (
            <Link
              href={`/owner/leads/${lead.id}/edit`}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit Lead
            </Link>
          ) : (
            <Link
              href={`/owner/deals/${lead.deal?.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
            >
              <Handshake className="w-4 h-4" />
              View Deal
            </Link>
          )
        }
      />

      {/* ═══ Profile Header Card ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none overflow-hidden">
        {/* Gradient Banner */}
        <div className={`h-28 bg-gradient-to-r ${STATUS_COLORS[lead.status] || "from-slate-500 to-gray-600"} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
              <StatusIcon className="w-10 h-10 text-slate-600 dark:text-slate-400" />
            </div>

            <div className="flex-1 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{lead.companyName}</h2>
                <div className="flex items-center gap-2">
                  <Badge value={lead.status} />
                  <Badge value={lead.priority} />
                  <Badge value={lead.source} />
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Contact: <span className="font-medium text-slate-700 dark:text-slate-300">{lead.contactName}</span>
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 transition-colors">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {lead.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Created {createdDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Pipeline Progress ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-6">Pipeline Progress</h3>
        <div className="flex items-center gap-0">
          {PIPELINE_STEPS.map((step, idx) => {
            const isActive = currentStepIdx >= idx;
            const isCurrent = lead.status === step;
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-[#5542F6] text-white shadow-lg shadow-indigo-500/30 ring-4 ring-indigo-500/10"
                        : isActive
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {isActive && !isCurrent ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isCurrent ? "text-[#5542F6]" : isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {step.replace(/_/g, " ")}
                  </span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-5 ${isActive && currentStepIdx > idx ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
        {(lead.status === "LOST" || lead.status === "UNQUALIFIED") && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Badge value={lead.status} />
            <span className="text-slate-500 dark:text-slate-400">— This lead is not in the main pipeline.</span>
          </div>
        )}
      </div>

      {/* ═══ Convert to Deal CTA (QUALIFIED only) ═══ */}
      {lead.status === "QUALIFIED" && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-[24px] p-6 lg:p-8 shadow-xl shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-950/20 flex items-center justify-center">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Ready to Convert!</h3>
                <p className="text-sm text-emerald-100">
                  This lead is qualified. Create a deal to move it into your sales pipeline.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDealModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-950 text-emerald-700 text-sm font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-all active:scale-[0.98] shrink-0"
            >
              <Handshake className="w-5 h-5" />
              Convert to Deal
            </button>
          </div>
        </div>
      )}

      {/* ═══ Converted Banner ═══ */}
      {lead.status === "CONVERTED" && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-[24px] p-6 lg:p-8 border border-emerald-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800">Lead Converted Successfully</h3>
                <p className="text-sm text-emerald-600">
                  Converted on {convertedDate}. This lead is now a deal in your pipeline.
                </p>
              </div>
            </div>
            {lead.deal && (
              <Link
                href={`/owner/deals/${lead.deal.id}`}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all shrink-0"
              >
                <Handshake className="w-4 h-4" />
                View Deal
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ═══ Key Details Grid ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DetailCard
          icon={DollarSign}
          label="Estimated Value"
          value={lead.estimatedValue ? format(lead.estimatedValue, { decimals: 0 }) : "Not set"}
          accent={!!lead.estimatedValue}
        />
        <DetailCard
          icon={UserCheck}
          label="Assigned To"
          value={lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : "Unassigned"}
          subtext={lead.assignee?.role?.replace(/_/g, " ")}
        />
        <DetailCard
          icon={CalendarClock}
          label="Follow-Up"
          value={followUpDate || "Not scheduled"}
          highlight={followUpDate && new Date(lead.followUpAt) <= new Date()}
        />
        <DetailCard
          icon={Calendar}
          label={lead.status === "CONVERTED" ? "Converted On" : "Last Updated"}
          value={
            convertedDate ||
            (lead.updatedAt
              ? new Date(lead.updatedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "—")
          }
        />
      </div>

      {/* ═══ Status Actions (not for QUALIFIED since we have the CTA above) ═══ */}
      {allowedTransitions.length > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Update Status</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Move this lead to the next stage in your pipeline.
          </p>
          <div className="flex flex-wrap gap-3">
            {allowedTransitions.map((nextStatus) => {
              const isLost = nextStatus === "LOST";
              return (
                <button
                  key={nextStatus}
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={isPending}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLost
                      ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <ArrowRight className="w-4 h-4" />
                  {nextStatus === "NEW" ? "Re-open" : nextStatus.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Samples ═══ */}
      <SamplesSection
        samples={initialSamples}
        entityType="lead"
        entityId={lead.id}
        showToast={showToast}
        readOnly={lead.status === "CONVERTED"}
      />

      {/* ═══ Follow-Ups ═══ */}
      {lead.status !== "CONVERTED" && (
        <FollowUpsSection
          followUps={initialFollowUps}
          leadId={lead.id}
          showToast={showToast}
        />
      )}

      {/* ═══ Meetings ═══ */}
      <MeetingsSection
        meetings={initialMeetings}
        entityType="lead"
        entityId={lead.id}
        showToast={showToast}
      />

      {/* ═══ Notes & People ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Notes</h3>
          </div>
          {lead.notes ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No notes added yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">People</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                {(lead.createdBy?.firstName?.[0] || "").toUpperCase()}
                {(lead.createdBy?.lastName?.[0] || "").toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  {lead.createdBy?.firstName} {lead.createdBy?.lastName}
                </p>
                <p className="text-xs text-slate-400">Created this lead</p>
              </div>
            </div>
            {lead.assignee && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                  {(lead.assignee?.firstName?.[0] || "").toUpperCase()}
                  {(lead.assignee?.lastName?.[0] || "").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {lead.assignee.firstName} {lead.assignee.lastName}
                  </p>
                  <p className="text-xs text-slate-400">Assigned sales person · {lead.assignee.role?.replace(/_/g, " ")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Lost Reason ═══ */}
      {lead.status === "LOST" && lead.lostReason && (
        <div className="bg-red-50 rounded-[24px] p-6 lg:p-8 border border-red-200">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-red-700">Lost Reason</h3>
          </div>
          <p className="text-sm text-red-600 leading-relaxed">{lead.lostReason}</p>
        </div>
      )}

      {/* ═══ Lost Reason Modal ═══ */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLostModal(false)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Mark Lead as Lost</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Please provide a reason for marking <span className="font-medium text-slate-700 dark:text-slate-300">{lead.companyName}</span> as lost.
            </p>
            <textarea
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              rows={3}
              placeholder="e.g., Budget constraints, went with competitor, no response..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm dark:shadow-none resize-none mb-6"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowLostModal(false); setLostReasonInput(""); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLostConfirm}
                disabled={isPending || !lostReasonInput.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Updating..." : "Mark as Lost"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Convert to Deal Modal ═══ */}
      {showDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDealModal(false)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Handshake className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Convert to Deal</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Create a deal from <span className="font-medium text-slate-700 dark:text-slate-300">{lead.companyName}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <SettingsInput
                label="Deal Title *"
                icon={Handshake}
                value={dealForm.title}
                onChange={(e) => setDealForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Acme Corporation — Website Redesign"
              />
              <SettingsInput
                label="Deal Value"
                type="number"
                icon={DollarSign}
                value={dealForm.value}
                onChange={(e) => setDealForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="Estimated deal value"
              />
              <SettingsSelect
                label="Assign To"
                icon={UserCheck}
                value={dealForm.assigneeId}
                onChange={(e) => setDealForm((p) => ({ ...p, assigneeId: e.target.value }))}
                options={[
                  { value: "", label: "— Keep current assignee —" },
                  ...assignees.map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.role.replace(/_/g, " ")})`,
                  })),
                ]}
              />
              <SettingsInput
                label="Expected Close Date"
                type="date"
                icon={CalendarClock}
                value={dealForm.expectedCloseAt}
                onChange={(e) => setDealForm((p) => ({ ...p, expectedCloseAt: e.target.value }))}
              />
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
                <textarea
                  value={dealForm.notes}
                  onChange={(e) => setDealForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Optional deal notes..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDealModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeal}
                disabled={isPending || !dealForm.title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Rocket className="w-4 h-4" />
                {isPending ? "Creating Deal..." : "Create Deal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Detail Card Component ─── */

function DetailCard({ icon: Icon, label, value, subtext, accent, highlight }) {
  return (
    <div
      className={`rounded-[24px] p-6 flex flex-col justify-between min-h-[140px] ${
        accent
          ? "bg-[#5542F6] text-white shadow-xl shadow-indigo-500/20"
          : highlight
            ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200"
            : "bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none"
      }`}
    >
      <div className="flex justify-between items-start">
        <span className={`font-medium text-sm ${accent ? "text-indigo-200" : highlight ? "text-amber-600" : "text-slate-600 dark:text-slate-400"}`}>
          {label}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              accent ? "bg-white dark:bg-slate-950/20" : highlight ? "bg-amber-100" : "bg-slate-50 dark:bg-slate-900 text-slate-400"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <span
          className={`text-lg font-bold ${accent ? "text-white" : highlight ? "text-amber-700" : "text-slate-900 dark:text-slate-50"}`}
          suppressHydrationWarning
        >
          {value}
        </span>
        {subtext && (
          <p className={`text-xs mt-0.5 ${accent ? "text-indigo-200" : "text-slate-400"}`}>{subtext}</p>
        )}
      </div>
    </div>
  );
}
