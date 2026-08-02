"use client";

import Link from "next/link";
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  Target,
  FileText,
  Calendar,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Badge from "@/components/ui/Badge";

export default function ClientDashboardContent({ stats }) {
  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">Unable to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Active Projects",
      value: stats.projects?.active || 0,
      icon: FolderKanban,
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    },
    {
      label: "Total Tasks",
      value: stats.tasks?.total || 0,
      icon: ListChecks,
      color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600",
    },
    {
      label: "Completed Tasks",
      value: stats.tasks?.completed || 0,
      icon: CheckCircle2,
      color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600",
    },
    {
      label: "Pending Reviews",
      value: stats.tasks?.inReview || 0,
      icon: Clock,
      color: "bg-amber-50 dark:bg-amber-900/20 text-amber-600",
    },
  ];

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here&apos;s an overview of your projects and activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Projects Overview */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-[#5542F6]" /> Projects
            </h2>
            <Link
              href="/client/projects"
              className="text-sm text-[#5542F6] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.projectsList?.length > 0 ? (
            <div className="space-y-3">
              {stats.projectsList.map((project) => (
                <Link
                  key={project.id}
                  href={`/client/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate group-hover:text-[#5542F6] transition-colors">
                      {project.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span>{project._count?.tasks || 0} tasks</span>
                      <span>{project._count?.milestones || 0} milestones</span>
                    </div>
                  </div>
                  <Badge value={project.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No projects yet.</p>
          )}
        </div>
{/* 
        Upcoming Milestones
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#5542F6]" /> Upcoming Milestones
          </h2>
          {stats.upcomingMilestones?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {milestone.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{milestone.project?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge value={milestone.status} />
                    {milestone.dueDate && (
                      <span className="text-xs text-slate-500">{formatDate(milestone.dueDate)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming milestones.</p>
          )}
        </div>

        Recent Documents
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5542F6]" /> Recent Documents
            </h2>
            <Link
              href="/client/documents"
              className="text-sm text-[#5542F6] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.recentDocuments?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge value={doc.type} />
                      <span className="text-xs text-slate-400">{doc.project?.name}</span>
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
        </div> */}

        {/* Upcoming Meetings */}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#5542F6]" /> Upcoming Meetings
            </h2>
            <Link
              href="/client/meetings"
              className="text-sm text-[#5542F6] hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {stats.upcomingMeetings?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                      {meeting.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge value={meeting.mode} />
                      <span className="text-xs text-slate-400">{meeting.project?.name}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formatDate(meeting.scheduledAt)}
                    </p>
                    <p className="text-xs text-slate-400">{formatTime(meeting.scheduledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">No upcoming meetings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
