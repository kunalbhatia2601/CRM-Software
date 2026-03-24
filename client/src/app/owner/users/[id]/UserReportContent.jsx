"use client";

import Link from "next/link";
import {
  Pencil,
  Mail,
  Phone,
  Calendar,
  Shield,
  Target,
  Handshake,
  Building2,
  FolderKanban,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Inbox,
} from "lucide-react";

import { useSite } from "@/context/SiteContext";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";

/* ─── Role context config ─── */
const ROLE_CONFIG = {
  OWNER: {
    label: "Owner",
    color: "from-purple-500 to-indigo-600",
    sections: ["leads", "deals", "clients", "projects"],
    description: "Full system access with all leads, deals, clients, and projects.",
  },
  ADMIN: {
    label: "Admin",
    color: "from-indigo-500 to-blue-600",
    sections: ["leads", "deals", "clients", "projects"],
    description: "Administrative access across all modules.",
  },
  SALES_MANAGER: {
    label: "Sales Manager",
    color: "from-blue-500 to-cyan-600",
    sections: ["leads", "deals"],
    description: "Focused on lead generation and deal closure.",
  },
  ACCOUNT_MANAGER: {
    label: "Account Manager",
    color: "from-cyan-500 to-teal-600",
    sections: ["clients", "projects", "deals"],
    description: "Manages client relationships and project delivery.",
  },
  FINANCE_MANAGER: {
    label: "Finance Manager",
    color: "from-emerald-500 to-green-600",
    sections: ["deals", "projects"],
    description: "Oversees financial aspects of deals and project budgets.",
  },
  HR: {
    label: "HR",
    color: "from-pink-500 to-rose-600",
    sections: ["leads", "deals", "clients", "projects"],
    description: "Human resources personnel with operational visibility.",
  },
  EMPLOYEE: {
    label: "Employee",
    color: "from-slate-500 to-gray-600",
    sections: ["leads", "deals", "projects"],
    description: "Team member contributing to leads, deals, and projects.",
  },
  CLIENT: {
    label: "Client",
    color: "from-amber-500 to-orange-600",
    sections: ["projects", "deals"],
    description: "External client with associated projects and deals.",
  },
};

export default function UserReportContent({ report }) {
  const { format, formatCompact } = useSite();
  const { user, summary, leads, deals, clients, projects } = report;

  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.EMPLOYEE;
  const sections = config.sections;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="User Report"
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Users", href: "/owner/users" },
          { label: `${user.firstName} ${user.lastName}` },
        ]}
        actions={
          <Link
            href={`/owner/users/${user.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit User
          </Link>
        }
      />

      {/* ═══ Profile Header Card ═══ */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden">
        {/* Gradient Banner */}
        <div className={`h-28 bg-gradient-to-r ${config.color} relative`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-4 border-white shadow-xl flex items-center justify-center text-2xl font-bold text-slate-700">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                `${(user.firstName?.[0] || "").toUpperCase()}${(user.lastName?.[0] || "").toUpperCase()}`
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="flex items-center gap-2">
                  <Badge value={user.role} />
                  <Badge value={user.status} />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4">{config.description}</p>

              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Joined {joinedDate}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Last login: {lastLogin}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Summary Stats ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {sections.includes("leads") && (
          <StatCard
            label="Total Leads"
            value={summary.totalLeads}
            subtext={`${leads.filter((l) => l.status === "QUALIFIED").length} qualified`}
            icon={Target}
          />
        )}
        {sections.includes("deals") && (
          <StatCard
            label="Total Deals"
            value={summary.totalDeals}
            subtext={`${summary.wonDeals} won · ${summary.lostDeals} lost`}
            icon={Handshake}
            accent={summary.wonDeals > 0}
          />
        )}
        {sections.includes("clients") && (
          <StatCard
            label="Clients Managed"
            value={summary.totalClients}
            subtext={`${summary.activeClients} active`}
            icon={Building2}
          />
        )}
        {sections.includes("projects") && (
          <StatCard
            label="Total Projects"
            value={summary.totalProjects}
            subtext={`${projects.filter((p) => p.status === "IN_PROGRESS").length} in progress`}
            icon={FolderKanban}
          />
        )}
      </div>

      {/* ═══ Deal Value Card (if has deals) ═══ */}
      {sections.includes("deals") && summary.totalDealValue > 0 && (
        <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Deal Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Total Pipeline Value</span>
              <span className="text-2xl font-bold text-slate-900" suppressHydrationWarning>
                {formatCompact(summary.totalDealValue)}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs text-emerald-600 font-medium">Won Deal Value</span>
              <span className="text-2xl font-bold text-emerald-700" suppressHydrationWarning>
                {formatCompact(summary.wonDealValue)}
              </span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="text-xs text-indigo-600 font-medium">Win Rate</span>
              <span className="text-2xl font-bold text-indigo-700">
                {summary.totalDeals > 0
                  ? `${((summary.wonDeals / summary.totalDeals) * 100).toFixed(0)}%`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Leads Table ═══ */}
      {sections.includes("leads") && (
        <ReportTable
          title="Leads"
          icon={Target}
          data={leads}
          emptyMessage="No leads associated with this user."
          columns={[
            { key: "companyName", label: "Company" },
            { key: "contactName", label: "Contact" },
            { key: "status", label: "Status", render: (v) => <Badge value={v} /> },
            { key: "priority", label: "Priority", render: (v) => <Badge value={v} /> },
            { key: "source", label: "Source", render: (v) => <Badge value={v} /> },
            {
              key: "estimatedValue",
              label: "Est. Value",
              align: "right",
              render: (v) => (
                <span suppressHydrationWarning>
                  {v ? format(v, { decimals: 0 }) : "—"}
                </span>
              ),
            },
          ]}
        />
      )}

      {/* ═══ Deals Table ═══ */}
      {sections.includes("deals") && (
        <ReportTable
          title="Deals"
          icon={Handshake}
          data={deals}
          emptyMessage="No deals associated with this user."
          columns={[
            { key: "title", label: "Deal" },
            {
              key: "lead",
              label: "Company",
              render: (v) => v?.companyName || "—",
            },
            { key: "stage", label: "Stage", render: (v) => <Badge value={v} /> },
            {
              key: "value",
              label: "Value",
              align: "right",
              render: (v) => (
                <span suppressHydrationWarning>
                  {v ? format(v, { decimals: 0 }) : "—"}
                </span>
              ),
            },
            {
              key: "createdAt",
              label: "Created",
              render: (v) =>
                v
                  ? new Date(v).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
            },
          ]}
        />
      )}

      {/* ═══ Clients Table ═══ */}
      {sections.includes("clients") && (
        <ReportTable
          title="Clients Managed"
          icon={Building2}
          data={clients}
          emptyMessage="No clients managed by this user."
          columns={[
            { key: "companyName", label: "Company" },
            { key: "contactName", label: "Contact" },
            { key: "status", label: "Status", render: (v) => <Badge value={v} /> },
            { key: "industry", label: "Industry", render: (v) => v || "—" },
            {
              key: "createdAt",
              label: "Since",
              render: (v) =>
                v
                  ? new Date(v).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
            },
          ]}
        />
      )}

      {/* ═══ Projects Table ═══ */}
      {sections.includes("projects") && (
        <ReportTable
          title="Projects"
          icon={FolderKanban}
          data={projects}
          emptyMessage="No projects associated with this user."
          columns={[
            { key: "name", label: "Project" },
            {
              key: "client",
              label: "Client",
              render: (v) => v?.companyName || "—",
            },
            { key: "status", label: "Status", render: (v) => <Badge value={v} /> },
            {
              key: "budget",
              label: "Budget",
              align: "right",
              render: (v) => (
                <span suppressHydrationWarning>
                  {v ? format(v, { decimals: 0 }) : "—"}
                </span>
              ),
            },
            {
              key: "startDate",
              label: "Start",
              render: (v) =>
                v
                  ? new Date(v).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
            },
            {
              key: "endDate",
              label: "End",
              render: (v) =>
                v
                  ? new Date(v).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
            },
          ]}
        />
      )}
    </div>
  );
}

/* ─── Reusable Report Table ─── */

function ReportTable({ title, icon: Icon, data, columns, emptyMessage }) {
  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 border border-slate-100 shadow-sm shadow-slate-200/50">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <span className="text-xs text-slate-400">{data.length} total</span>
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`pb-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="border-b border-slate-50 last:border-0"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`py-3.5 ${col.align === "right" ? "text-right" : ""} ${
                        col.key === columns[0].key
                          ? "font-medium text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Inbox className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
