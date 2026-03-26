"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Building2,
  User,
  UserCheck,
  Briefcase,
  FileText,
  FolderKanban,
  Handshake,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";

const STATUS_COLORS = {
  ACTIVE: "from-emerald-500 to-green-600",
  INACTIVE: "from-slate-500 to-gray-600",
  CHURNED: "from-red-500 to-rose-600",
};

const STATUS_ICONS = {
  ACTIVE: CheckCircle2,
  INACTIVE: Clock,
  CHURNED: AlertCircle,
};

export default function ClientDetailContent({ initialClient }) {
  const [client] = useState(initialClient);
  const { format } = useSite();

  const StatusIcon = STATUS_ICONS[client.status] || Building2;
  const gradientClass = STATUS_COLORS[client.status] || STATUS_COLORS.ACTIVE;

  const createdDate = client.createdAt
    ? new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const projects = client.projects || [];
  const activeProjects = projects.filter((p) => ["IN_PROGRESS", "NOT_STARTED"].includes(p.status));
  const completedProjects = projects.filter((p) => p.status === "COMPLETED");

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Client Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Clients", href: "/owner/clients" },
          { label: client.companyName },
        ]}
        actions={
          <Link
            href={`/owner/clients/${client.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit Client
          </Link>
        }
      />

      {/* ═══ Profile Header ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none overflow-hidden">
        <div className={`h-28 bg-gradient-to-r ${gradientClass} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-4 border-white shadow-xl flex items-center justify-center">
              <StatusIcon className="w-10 h-10 text-slate-600 dark:text-slate-400" />
            </div>

            <div className="flex-1 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{client.companyName}</h2>
                <div className="flex items-center gap-2">
                  <Badge value={client.status} />
                  {client.industry && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {client.industry}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Contact: <span className="font-medium text-slate-700 dark:text-slate-300">{client.contactName}</span>
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${client.email}`} className="hover:text-indigo-600 transition-colors">{client.email}</a>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {client.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Client since {createdDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Key Details Grid ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <DetailCard
          icon={FolderKanban}
          label="Active Projects"
          value={activeProjects.length.toString()}
          subtext={`${completedProjects.length} completed`}
          accent={activeProjects.length > 0}
        />
        <DetailCard
          icon={UserCheck}
          label="Account Manager"
          value={client.accountManager ? `${client.accountManager.firstName} ${client.accountManager.lastName}` : "Unassigned"}
          subtext={client.accountManager?.role?.replace(/_/g, " ")}
        />
        <DetailCard
          icon={Handshake}
          label="Source Deal"
          value={client.deal ? client.deal.title : "Manual"}
          subtext={client.deal ? `${client.deal.stage} — ${format(Number(client.deal.value || 0), { decimals: 0 })}` : "No deal associated"}
        />
        <DetailCard
          icon={Calendar}
          label="Last Updated"
          value={
            client.updatedAt
              ? new Date(client.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—"
          }
        />
      </div>

      {/* ═══ Contact & Business Info ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Contact Information</h3>
          </div>
          <div className="flex flex-col gap-4">
            <InfoRow icon={Mail} label="Email" value={client.email} link={client.email ? `mailto:${client.email}` : null} />
            <InfoRow icon={Phone} label="Phone" value={client.phone} />
            <InfoRow icon={MapPin} label="Address" value={client.address} />
            <InfoRow icon={Globe} label="Website" value={client.website} link={client.website} external />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Business Details</h3>
          </div>
          <div className="flex flex-col gap-4">
            <InfoRow icon={Briefcase} label="Industry" value={client.industry} />
            <InfoRow icon={Building2} label="Company" value={client.companyName} />
            <InfoRow icon={UserCheck} label="Account Manager" value={client.accountManager ? `${client.accountManager.firstName} ${client.accountManager.lastName}` : "Unassigned"} />
            <InfoRow icon={Calendar} label="Client Since" value={createdDate} />
          </div>
        </div>
      </div>

      {/* ═══ Projects ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Projects</h3>
              <p className="text-xs text-slate-400">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Link
            href={`/owner/projects/create?clientId=${client.id}`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <FolderKanban className="w-4 h-4" />
            New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No projects yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/owner/projects/${project.id}`}
                className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge value={project.status} />
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  {project.startDate && (
                    <span>{new Date(project.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  )}
                  {project.endDate && (
                    <span>→ {new Date(project.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Notes ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Notes</h3>
        </div>
        {client.notes ? (
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{client.notes}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">No notes added yet.</p>
        )}
      </div>

      {/* ═══ People ═══ */}
      {client.accountManager && (
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Team</h3>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
              {(client.accountManager.firstName?.[0] || "").toUpperCase()}
              {(client.accountManager.lastName?.[0] || "").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {client.accountManager.firstName} {client.accountManager.lastName}
              </p>
              <p className="text-xs text-slate-400">Account Manager · {client.accountManager.role?.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Detail Card ─── */

function DetailCard({ icon: Icon, label, value, subtext, accent }) {
  return (
    <div
      className={`rounded-[24px] p-6 flex flex-col justify-between min-h-[140px] ${
        accent
          ? "bg-[#5542F6] text-white shadow-xl shadow-indigo-500/20"
          : "bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none"
      }`}
    >
      <div className="flex justify-between items-start">
        <span className={`font-medium text-sm ${accent ? "text-indigo-200" : "text-slate-600 dark:text-slate-400"}`}>
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${accent ? "bg-white dark:bg-slate-950/20" : "bg-slate-50 dark:bg-slate-900 text-slate-400"}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <span className={`text-lg font-bold ${accent ? "text-white" : "text-slate-900 dark:text-slate-50"}`} suppressHydrationWarning>
          {value}
        </span>
        {subtext && (
          <p className={`text-xs mt-0.5 ${accent ? "text-indigo-200" : "text-slate-400"}`}>{subtext}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Info Row ─── */

function InfoRow({ icon: Icon, label, value, link, external }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-sm text-slate-500 dark:text-slate-400 min-w-[100px]">{label}</span>
      {link ? (
        <a
          href={link}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
        >
          {value || "—"}
          {external && <ExternalLink className="w-3 h-3" />}
        </a>
      ) : (
        <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{value || "—"}</span>
      )}
    </div>
  );
}
