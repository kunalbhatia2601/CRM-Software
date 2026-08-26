"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Target,
  FileText,
  Calendar,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ExpenseTiles from "@/components/expenses/ExpenseTiles";

export default function AccountDashboardContent({ stats }) {
  const { user } = useAuth();
  const userName = user?.firstName || "Account Manager";

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">Unable to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const s = stats;

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const statCards = [
    { label: "My Clients", value: s.clients?.active || 0, icon: Building2, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600", href: "/accounts/clients" },
    { label: "Active Projects", value: s.projects?.active || 0, icon: FolderKanban, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600", href: "/accounts/projects" },
    { label: "Total Tasks", value: s.tasks?.total || 0, icon: ListChecks, color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600" },
    { label: "Completed Tasks", value: s.tasks?.completed || 0, icon: CheckCircle2, color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Hello, {userName}! <span className="text-xl">👋</span></h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your clients, projects, and upcoming activity.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Wrapper = stat.href ? Link : "div";
          return (
            <Wrapper key={stat.label} {...(stat.href ? { href: stat.href } : {})} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</p>
            </Wrapper>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Clients */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#5542F6]" /> My Clients
            </h2>
            <Link href="/accounts/clients" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.clientsList?.length > 0 ? (
            <div className="space-y-3">
              {s.clientsList.map((client) => (
                <Link key={client.id} href={`/accounts/clients/${client.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate group-hover:text-[#5542F6]">{client.companyName}</h4>
                    <p className="text-xs text-slate-400">{client.contactName} · {client._count?.projects || 0} projects</p>
                  </div>
                  <Badge value={client.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No clients assigned yet.</p>
          )}
        </div>

        {/* Projects */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#5542F6]" /> My Projects
            </h2>
            <Link href="/accounts/projects" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.projectsList?.length > 0 ? (
            <div className="space-y-3">
              {s.projectsList.map((project) => (
                <Link key={project.id} href={`/accounts/projects/${project.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate group-hover:text-[#5542F6]">{project.name}</h4>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span>{project.client?.companyName}</span>
                      <span>{project._count?.tasks || 0} tasks</span>
                    </div>
                  </div>
                  <Badge value={project.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No projects assigned yet.</p>
          )}
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#5542F6]" /> Upcoming Milestones
          </h2>
          {s.upcomingMilestones?.length > 0 ? (
            <div className="space-y-3">
              {s.upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{milestone.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{milestone.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge value={milestone.status} />
                    {milestone.dueDate && <span className="text-xs text-slate-500">{formatDate(milestone.dueDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming milestones.</p>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5542F6]" /> Upcoming Meetings
            </h2>
            <Link href="/accounts/meetings" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.upcomingMeetings?.length > 0 ? (
            <div className="space-y-3">
              {s.upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{meeting.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge value={meeting.mode} />
                      <span className="text-xs text-slate-400">{meeting.project?.name}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(meeting.scheduledAt)}</p>
                    <p className="text-xs text-slate-400">{formatTime(meeting.scheduledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming meetings.</p>
          )}
        </div>

        {/* Recent Documents */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5542F6]" /> Recent Documents
            </h2>
            <Link href="/accounts/documents" className="text-sm text-[#5542F6] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {s.recentDocuments?.length > 0 ? (
            <div className="space-y-3">
              {s.recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{doc.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge value={doc.type} />
                      <span className="text-xs text-slate-400">{doc.project?.name}</span>
                      <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.requiresSignature && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${doc.isSigned ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {doc.isSigned ? "Signed" : "Needs Signature"}
                      </span>
                    )}
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No documents yet.</p>
          )}
        </div>
      </div>
      <ExpenseTiles basePath="/accounts" />

    </div>
  );
}
