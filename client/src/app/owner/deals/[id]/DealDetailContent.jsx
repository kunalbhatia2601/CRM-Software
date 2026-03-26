"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Mail,
  Phone,
  Calendar,
  Building2,
  User,
  Target,
  DollarSign,
  FileText,
  ArrowRight,
  AlertCircle,
  CalendarClock,
  UserCheck,
  XCircle,
  CheckCircle2,
  Handshake,
  FolderKanban,
  Trophy,
  Search,
  Rocket,
  PackageCheck,
  Plus,
  X,
  ListChecks,
} from "lucide-react";

import { updateDealStage, getAccountManagers, addServicesToDeal, removeServiceFromDeal, getDeal } from "@/actions/deals.action";
import { getServicesDropdown } from "@/actions/services.action";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import SettingsSelect from "@/components/settings/SettingsSelect";

/* ─── Stage flow config ─── */
const STAGE_TRANSITIONS = {
  DISCOVERY: ["PROPOSAL", "LOST"],
  PROPOSAL: ["NEGOTIATION", "LOST"],
  NEGOTIATION: ["WON", "LOST"],
  WON: [],
  LOST: ["DISCOVERY"],
};

const STAGE_COLORS = {
  DISCOVERY: "from-indigo-500 to-blue-600",
  PROPOSAL: "from-blue-500 to-cyan-600",
  NEGOTIATION: "from-amber-500 to-orange-600",
  WON: "from-emerald-500 to-green-600",
  LOST: "from-red-500 to-rose-600",
};

const STAGE_ICONS = {
  DISCOVERY: Search,
  PROPOSAL: FileText,
  NEGOTIATION: Handshake,
  WON: Trophy,
  LOST: XCircle,
};

const PIPELINE_STEPS = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON"];

function getStepIndex(stage) {
  if (stage === "LOST") return -1;
  return PIPELINE_STEPS.indexOf(stage);
}

export default function DealDetailContent({ initialDeal }) {
  const router = useRouter();
  const { format, formatCompact } = useSite();
  const [deal, setDeal] = useState(initialDeal);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  // Lost reason modal
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState("");

  // (WON flow now uses /owner/deals/[id]/convert page)

  // Services
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  useEffect(() => {
    if (showAddServiceModal && availableServices.length === 0) {
      getServicesDropdown().then(setAvailableServices);
    }
  }, [showAddServiceModal]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStageChange = (newStage) => {
    if (newStage === "LOST") {
      setShowLostModal(true);
      return;
    }
    if (newStage === "WON") {
      // Redirect to dedicated convert page instead of auto-creating
      router.push(`/owner/deals/${deal.id}/convert`);
      return;
    }

    startTransition(async () => {
      const result = await updateDealStage(deal.id, newStage);
      if (result.success) {
        setDeal(result.data.deal || result.data);
        showToast("success", `Deal moved to ${newStage}`);
      } else {
        showToast("error", result.error || "Failed to update stage");
      }
    });
  };

  const handleLostConfirm = () => {
    if (!lostReasonInput.trim()) {
      showToast("error", "Please provide a reason");
      return;
    }
    startTransition(async () => {
      const result = await updateDealStage(deal.id, "LOST", lostReasonInput.trim());
      if (result.success) {
        setDeal(result.data.deal || result.data);
        setShowLostModal(false);
        setLostReasonInput("");
        showToast("success", "Deal marked as lost");
      } else {
        showToast("error", result.error || "Failed to update stage");
      }
    });
  };

  const handleAddService = () => {
    if (!selectedServiceId) return;
    startTransition(async () => {
      const result = await addServicesToDeal(deal.id, [{ serviceId: selectedServiceId }]);
      if (result.success) {
        // Refetch deal to get updated services
        const refreshed = await getDeal(deal.id);
        if (refreshed.success) setDeal(refreshed.data);
        setSelectedServiceId("");
        setShowAddServiceModal(false);
        showToast("success", "Service added to deal");
      } else {
        showToast("error", result.error || "Failed to add service");
      }
    });
  };

  const handleRemoveService = (serviceId) => {
    startTransition(async () => {
      const result = await removeServiceFromDeal(deal.id, serviceId);
      if (result.success) {
        const refreshed = await getDeal(deal.id);
        if (refreshed.success) setDeal(refreshed.data);
        showToast("success", "Service removed");
      } else {
        showToast("error", result.error || "Failed to remove service");
      }
    });
  };

  const allowedTransitions = STAGE_TRANSITIONS[deal.stage] || [];
  const StageIcon = STAGE_ICONS[deal.stage] || Handshake;
  const currentStepIdx = getStepIndex(deal.stage);

  const createdDate = deal.createdAt
    ? new Date(deal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const expectedClose = deal.expectedCloseAt
    ? new Date(deal.expectedCloseAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const wonDate = deal.wonAt
    ? new Date(deal.wonAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Deal Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Deals", href: "/owner/deals" },
          { label: deal.title },
        ]}
        actions={
          deal.stage !== "WON" ? (
            <Link
              href={`/owner/deals/${deal.id}/edit`}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
            >
              <Pencil className="w-4 h-4" />
              Edit Deal
            </Link>
          ) : null
        }
      />

      {/* ═══ Header Card ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none overflow-hidden">
        <div className={`h-28 bg-gradient-to-r ${STAGE_COLORS[deal.stage] || "from-slate-500 to-gray-600"} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>
        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
              <StageIcon className="w-10 h-10 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{deal.title}</h2>
                <Badge value={deal.stage} />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                From lead: <span className="font-medium text-slate-700 dark:text-slate-300">{deal.lead?.companyName}</span>
                {deal.lead?.contactName && ` — ${deal.lead.contactName}`}
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                {deal.lead?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {deal.lead.email}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Created {createdDate}
                </div>
                {deal.lead?.source && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-400" />
                    Source: <Badge value={deal.lead.source} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Pipeline Progress ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-6">Deal Pipeline</h3>
        <div className="flex items-center gap-0">
          {PIPELINE_STEPS.map((step, idx) => {
            const isActive = currentStepIdx >= idx;
            const isCurrent = deal.stage === step;
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
                    {isActive && !isCurrent ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCurrent ? "text-[#5542F6]" : isActive ? "text-emerald-600" : "text-slate-400"}`}>
                    {step}
                  </span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 -mt-5 ${isActive && currentStepIdx > idx ? "bg-emerald-400" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
        {deal.stage === "LOST" && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Badge value="LOST" />
            <span className="text-slate-500 dark:text-slate-400">— This deal is not in the active pipeline.</span>
          </div>
        )}
      </div>

      {/* ═══ Key Metrics ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DetailCard
          icon={DollarSign}
          label="Deal Value"
          value={deal.value ? format(deal.value, { decimals: 0 }) : "Not set"}
          accent={!!deal.value}
        />
        <DetailCard
          icon={UserCheck}
          label="Assigned To"
          value={deal.assignee ? `${deal.assignee.firstName} ${deal.assignee.lastName}` : "Unassigned"}
          subtext={deal.assignee?.role?.replace(/_/g, " ")}
        />
        <DetailCard
          icon={CalendarClock}
          label="Expected Close"
          value={expectedClose || "Not set"}
          highlight={expectedClose && new Date(deal.expectedCloseAt) <= new Date() && deal.stage !== "WON"}
        />
        <DetailCard
          icon={Calendar}
          label={deal.stage === "WON" ? "Won On" : "Last Updated"}
          value={
            wonDate ||
            (deal.updatedAt
              ? new Date(deal.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—")
          }
        />
      </div>

      {/* ═══ WON Banner ═══ */}
      {deal.stage === "WON" && (
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-[24px] p-6 lg:p-8 shadow-xl shadow-emerald-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-white" />
              <h3 className="text-xl font-bold text-white">Deal Won!</h3>
            </div>
            <p className="text-sm text-emerald-100 mb-5">
              This deal was won on {wonDate}. A Client, Project, and User account were auto-created.
            </p>
            <div className="flex flex-wrap gap-3">
              {deal.client && (
                <Link
                  href={`/owner/clients/${deal.client.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  {deal.client.companyName}
                </Link>
              )}
              {deal.project && (
                <Link
                  href={`/owner/projects/${deal.project.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950/20 hover:bg-white/30 text-white text-sm font-medium rounded-xl transition-all"
                >
                  <FolderKanban className="w-4 h-4" />
                  {deal.project.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Stage Actions ═══ */}
      {allowedTransitions.length > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Update Stage</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Move this deal forward or mark it as lost.</p>
          <div className="flex flex-wrap gap-3">
            {allowedTransitions.map((nextStage) => {
              const isLost = nextStage === "LOST";
              const isWon = nextStage === "WON";
              return (
                <button
                  key={nextStage}
                  onClick={() => handleStageChange(nextStage)}
                  disabled={isPending}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                    isWon
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                      : isLost
                        ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {isWon ? <Trophy className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  {nextStage === "DISCOVERY" ? "Re-open" : nextStage}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ Services ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Services</h3>
              <p className="text-xs text-slate-400">Services included in this deal</p>
            </div>
          </div>
          {deal.stage !== "WON" && (
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          )}
        </div>

        {deal.dealServices && deal.dealServices.length > 0 ? (
          <div className="space-y-3">
            {deal.dealServices.map((ds) => {
              const priceChanged = ds.originalPrice && Number(ds.price) !== Number(ds.originalPrice);
              return (
                <div key={ds.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {ds.service?.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/owner/services/${ds.service?.id}`} className="text-sm font-semibold text-slate-900 dark:text-slate-50 hover:text-indigo-600 transition-colors">
                        {ds.service?.name}
                      </Link>
                      {ds.service?.points && ds.service.points.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {ds.service.points.slice(0, 3).join(" · ")}{ds.service.points.length > 3 ? ` +${ds.service.points.length - 3} more` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-50" suppressHydrationWarning>{format(Number(ds.price))}</span>
                      {priceChanged && (
                        <p className="text-xs text-amber-600 mt-0.5" suppressHydrationWarning>
                          was {format(Number(ds.originalPrice))}
                        </p>
                      )}
                      {ds.quantity > 1 && <p className="text-xs text-slate-400">x{ds.quantity}</p>}
                    </div>
                    {deal.stage !== "WON" && (
                      <button
                        onClick={() => handleRemoveService(ds.service?.id)}
                        disabled={isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Remove service"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700 mt-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Services Value</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50" suppressHydrationWarning>
                {format(deal.dealServices.reduce((sum, ds) => sum + Number(ds.price) * (ds.quantity || 1), 0))}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No services added to this deal yet.</p>
            {deal.stage !== "WON" && (
              <button
                onClick={() => setShowAddServiceModal(true)}
                className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Add your first service
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══ Add Service Modal ═══ */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddServiceModal(false)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <PackageCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Add Service</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Select a service to add to this deal.</p>
              </div>
            </div>

            <SettingsSelect
              label="Service"
              icon={PackageCheck}
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              options={[
                { value: "", label: "— Select Service —" },
                ...availableServices
                  .filter((s) => !deal.dealServices?.some((ds) => ds.service?.id === s.id))
                  .map((s) => ({
                    value: s.id,
                    label: `${s.name} — ${format(Number(s.salePrice || s.price))}`,
                  })),
              ]}
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddServiceModal(false); setSelectedServiceId(""); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddService}
                disabled={isPending || !selectedServiceId}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {isPending ? "Adding..." : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Notes & People ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Notes</h3>
          </div>
          {deal.notes ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{deal.notes}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">No notes added.</p>
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
            {deal.createdBy && (
              <PersonRow
                initials={`${deal.createdBy.firstName?.[0] || ""}${deal.createdBy.lastName?.[0] || ""}`}
                name={`${deal.createdBy.firstName} ${deal.createdBy.lastName}`}
                role="Created this deal"
                color="bg-indigo-100 text-indigo-600"
              />
            )}
            {deal.assignee && (
              <PersonRow
                initials={`${deal.assignee.firstName?.[0] || ""}${deal.assignee.lastName?.[0] || ""}`}
                name={`${deal.assignee.firstName} ${deal.assignee.lastName}`}
                role={`Assigned · ${deal.assignee.role?.replace(/_/g, " ")}`}
                color="bg-emerald-100 text-emerald-600"
              />
            )}
            {deal.lead?.contactName && (
              <PersonRow
                initials={deal.lead.contactName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                name={deal.lead.contactName}
                role={`Lead contact · ${deal.lead.companyName}`}
                color="bg-amber-100 text-amber-600"
              />
            )}
          </div>
        </div>
      </div>

      {/* ═══ Lost Reason ═══ */}
      {deal.stage === "LOST" && deal.lostReason && (
        <div className="bg-red-50 rounded-[24px] p-6 lg:p-8 border border-red-200">
          <div className="flex items-center gap-3 mb-3">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-red-700">Lost Reason</h3>
          </div>
          <p className="text-sm text-red-600 leading-relaxed">{deal.lostReason}</p>
        </div>
      )}

      {/* ═══ Lost Modal ═══ */}
      {showLostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLostModal(false)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">Mark Deal as Lost</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Why was <span className="font-medium text-slate-700 dark:text-slate-300">{deal.title}</span> lost?
            </p>
            <textarea
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              rows={3}
              placeholder="e.g., Budget constraints, competitor won, scope change..."
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

    </div>
  );
}

/* ─── Detail Card ─── */

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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent ? "bg-white dark:bg-slate-950/20" : highlight ? "bg-amber-100" : "bg-slate-50 dark:bg-slate-900 text-slate-400"}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <span className={`text-lg font-bold ${accent ? "text-white" : highlight ? "text-amber-700" : "text-slate-900 dark:text-slate-50"}`} suppressHydrationWarning>
          {value}
        </span>
        {subtext && <p className={`text-xs mt-0.5 ${accent ? "text-indigo-200" : "text-slate-400"}`}>{subtext}</p>}
      </div>
    </div>
  );
}

/* ─── Person Row ─── */

function PersonRow({ initials, name, role, color }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${color}`}>
        {(initials || "").toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{name}</p>
        <p className="text-xs text-slate-400">{role}</p>
      </div>
    </div>
  );
}
