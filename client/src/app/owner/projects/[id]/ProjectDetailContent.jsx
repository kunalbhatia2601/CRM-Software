"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Calendar,
  DollarSign,
  Building2,
  UserCheck,
  Handshake,
  FolderKanban,
  FileText,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  PlayCircle,
  ExternalLink,
  PackageCheck,
  ListChecks,
  RefreshCw,
  CalendarClock,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

const STATUS_COLORS = {
  NOT_STARTED: "from-slate-500 to-gray-600",
  IN_PROGRESS: "from-blue-500 to-indigo-600",
  ON_HOLD: "from-amber-500 to-orange-600",
  COMPLETED: "from-emerald-500 to-green-600",
  CANCELLED: "from-red-500 to-rose-600",
};

const STATUS_ICONS = {
  NOT_STARTED: Clock,
  IN_PROGRESS: PlayCircle,
  ON_HOLD: PauseCircle,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

function DetailCard({ icon: Icon, label, value, subtext, accent }) {
  return (
    <div
      className={`rounded-[24px] p-6 flex flex-col justify-between min-h-[140px] ${
        accent
          ? "bg-[#5542F6] text-white shadow-xl shadow-indigo-500/20"
          : "bg-white border border-slate-100 shadow-sm shadow-slate-200/50"
      }`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`font-medium text-sm ${
            accent ? "text-indigo-200" : "text-slate-600"
          }`}
        >
          {label}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              accent ? "bg-white/20" : "bg-slate-50 text-slate-400"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <span
          className={`text-lg font-bold ${
            accent ? "text-white" : "text-slate-900"
          }`}
          suppressHydrationWarning
        >
          {value}
        </span>
        {subtext && (
          <p
            className={`text-xs mt-0.5 ${
              accent ? "text-indigo-200" : "text-slate-400"
            }`}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, link, external }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-sm text-slate-500 min-w-[100px]">{label}</span>
      {link ? (
        <Link
          href={link}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
        >
          {value || "—"}
          {external && <ExternalLink className="w-3 h-3" />}
        </Link>
      ) : (
        <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
      )}
    </div>
  );
}

function AvatarBadge({ initials, name, label }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
        {initials}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        {label && <p className="text-xs text-slate-400">{label}</p>}
      </div>
    </div>
  );
}

export default function ProjectDetailContent({ initialProject }) {
  const [project] = useState(initialProject);
  const { format } = useSite();

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const StatusIcon = STATUS_ICONS[project.status] || Clock;
  const gradientClass = STATUS_COLORS[project.status] || STATUS_COLORS.NOT_STARTED;

  const getStatusLabel = (status) => {
    const statusMap = {
      NOT_STARTED: "Not Started",
      IN_PROGRESS: "In Progress",
      ON_HOLD: "On Hold",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return statusMap[status] || status;
  };

  const getBillingLabel = (cycle) => {
    const map = {
      ONE_TIME: "One Time",
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      SEMI_ANNUAL: "Semi Annual",
      ANNUAL: "Annual",
    };
    return map[cycle] || cycle;
  };

  const isRecurring = project.billingCycle && project.billingCycle !== "ONE_TIME";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Page Header */}
      <PageHeader
        title="Project Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Projects", href: "/owner/projects" },
          { label: project.name },
        ]}
        actions={
          <Link
            href={`/owner/projects/${project.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit Project
          </Link>
        }
      />

      {/* Profile Header */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        <div className={`h-28 bg-gradient-to-r ${gradientClass} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
              <StatusIcon className="w-10 h-10 text-slate-600" />
            </div>

            <div className="flex-1 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">{project.name}</h2>
                <Badge value={project.status} />
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Client:{" "}
                <Link
                  href={`/owner/clients/${project.client?.id}`}
                  className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {project.client?.companyName}
                </Link>
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  {formatDate(project.startDate)} → {formatDate(project.endDate)}
                </div>
                <div className="flex items-center gap-2" suppressHydrationWarning>
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  {project.budget ? format(Number(project.budget), { decimals: 0 }) : "Not Set"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DetailCard
          icon={FolderKanban}
          label="Status"
          value={getStatusLabel(project.status)}
          accent={project.status === "IN_PROGRESS"}
        />
        <DetailCard
          icon={DollarSign}
          label="Budget"
          value={project.budget ? format(Number(project.budget), { decimals: 0 }) : "Not Set"}
        />
        <DetailCard
          icon={Calendar}
          label="Timeline"
          value={formatDate(project.startDate)}
          subtext={`→ ${formatDate(project.endDate)}`}
        />
        <DetailCard
          icon={RefreshCw}
          label="Billing Cycle"
          value={getBillingLabel(project.billingCycle)}
          accent={isRecurring}
        />
      </div>

      {/* Recurring Billing Info — only show for recurring projects */}
      {isRecurring && (
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-[24px] p-6 border border-violet-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recurring Project</h3>
              <p className="text-xs text-slate-500">This project bills on a {getBillingLabel(project.billingCycle).toLowerCase()} cycle</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-violet-100">
              <p className="text-xs text-slate-500 mb-1">Billing Cycle</p>
              <p className="text-sm font-bold text-violet-700">{getBillingLabel(project.billingCycle)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-violet-100">
              <p className="text-xs text-slate-500 mb-1">Next Billing Date</p>
              <p className="text-sm font-bold text-slate-900">{formatDate(project.nextBillingDate)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-violet-100">
              <p className="text-xs text-slate-500 mb-1">Budget per Cycle</p>
              <p className="text-sm font-bold text-slate-900" suppressHydrationWarning>
                {project.budget ? format(Number(project.budget), { decimals: 0 }) : "Not Set"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manager Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DetailCard
          icon={UserCheck}
          label="Account Manager"
          value={
            project.accountManager
              ? `${project.accountManager.firstName} ${project.accountManager.lastName}`
              : "Unassigned"
          }
          subtext={project.accountManager?.role || ""}
        />
      </div>

      {/* Project Information & Client Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information Card */}
        <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Project Information</h3>
          </div>
          <div className="flex flex-col">
            <InfoRow
              icon={FolderKanban}
              label="Name"
              value={project.name}
            />
            <InfoRow
              icon={FileText}
              label="Description"
              value={project.description}
            />
            <InfoRow
              icon={Calendar}
              label="Start Date"
              value={formatDate(project.startDate)}
            />
            <InfoRow
              icon={Calendar}
              label="End Date"
              value={formatDate(project.endDate)}
            />
            <InfoRow
              icon={DollarSign}
              label="Budget"
              value={project.budget ? format(Number(project.budget), { decimals: 0 }) : "Not Set"}
            />
            <InfoRow
              icon={RefreshCw}
              label="Billing"
              value={getBillingLabel(project.billingCycle)}
            />
            {isRecurring && (
              <InfoRow
                icon={CalendarClock}
                label="Next Billing"
                value={formatDate(project.nextBillingDate)}
              />
            )}
            <InfoRow
              icon={Calendar}
              label="Created"
              value={formatDate(project.createdAt)}
            />
          </div>
        </div>

        {/* Client Details Card */}
        <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Client Details</h3>
          </div>
          <div className="flex flex-col">
            <InfoRow
              icon={Building2}
              label="Company"
              value={project.client.companyName}
              link={`/owner/clients/${project.client.id}`}
            />
            <InfoRow
              icon={User}
              label="Contact"
              value={project.client.contactName}
            />
            <div className="flex items-center gap-3 py-2 border-b border-slate-50">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-500 min-w-[100px]">Status</span>
              <Badge value={project.client?.status} />
            </div>
            {project.deal && (
              <>
                <InfoRow
                  icon={Handshake}
                  label="Source Deal"
                  value={project.deal.title}
                  link={`/owner/deals/${project.deal.id}`}
                />
                <InfoRow
                  icon={DollarSign}
                  label="Deal Value"
                  value={format(Number(project.deal.value || 0), { decimals: 0 })}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      {project.projectServices && project.projectServices.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Services</h3>
              <p className="text-xs text-slate-400">Services delivered in this project</p>
            </div>
          </div>

          <div className="space-y-3">
            {project.projectServices.map((ps) => {
              const priceChanged = ps.originalPrice && Number(ps.price) !== Number(ps.originalPrice);
              return (
                <div key={ps.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {ps.service?.name?.[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/owner/services/${ps.service?.id}`} className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors">
                        {ps.service?.name}
                      </Link>
                      {ps.service?.points && ps.service.points.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {ps.service.points.slice(0, 4).map((point, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3" />
                              {point}
                            </span>
                          ))}
                          {ps.service.points.length > 4 && (
                            <span className="text-xs text-slate-400 px-2 py-0.5">+{ps.service.points.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-sm font-semibold text-slate-900" suppressHydrationWarning>{format(Number(ps.price), { decimals: 0 })}</span>
                    {priceChanged && (
                      <p className="text-xs text-amber-600 mt-0.5" suppressHydrationWarning>
                        was {format(Number(ps.originalPrice), { decimals: 0 })}
                      </p>
                    )}
                    {ps.quantity > 1 && <p className="text-xs text-slate-400">x{ps.quantity}</p>}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-3">
              <span className="text-sm font-medium text-slate-500">Total Services Value</span>
              <span className="text-lg font-bold text-slate-900" suppressHydrationWarning>
                {format(project.projectServices.reduce((sum, ps) => sum + Number(ps.price) * (ps.quantity || 1), 0), { decimals: 0 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Notes</h3>
        </div>
        {project.notes ? (
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{project.notes}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">No notes added yet.</p>
        )}
      </div>

      {/* Team Section */}
      <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Team</h3>
        </div>
        <div className="flex flex-col">
          {project.accountManager && (
            <AvatarBadge
              initials={`${project.accountManager.firstName[0]}${project.accountManager.lastName[0]}`}
              name={`${project.accountManager.firstName} ${project.accountManager.lastName}`}
              label={project.accountManager.role}
            />
          )}
          {project.createdBy && (
            <AvatarBadge
              initials={`${project.createdBy.firstName[0]}${project.createdBy.lastName[0]}`}
              name={`${project.createdBy.firstName} ${project.createdBy.lastName}`}
              label="Created By"
            />
          )}
        </div>
      </div>
    </div>
  );
}
