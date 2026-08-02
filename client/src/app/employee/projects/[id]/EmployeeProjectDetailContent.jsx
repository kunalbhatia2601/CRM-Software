"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  User,
  Target,
  FileText,
  ExternalLink,
  Video,
  Phone,
  MapPin,
  Clock,
  LayoutList,
  Kanban,
  Users,
  ClipboardList,
  ListChecks,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import PlanningSection from "@/components/project/PlanningSection";
import KanbanBoard from "@/components/project/KanbanBoard";
import Toast from "@/components/ui/Toast";

export default function EmployeeProjectDetailContent({
  initialProject,
  initialMeetings = [],
  initialDocuments = [],
  initialSteps = [],
  initialTasks = [],
  initialMilestones = [],
  assignableUsers = [],
}) {
  const [project] = useState(initialProject);
  const [tasks, setTasks] = useState(initialTasks);
  const [planningView, setPlanningView] = useState("list");
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const modeIcons = { VIRTUAL: Video, PHONE_CALL: Phone, IN_PERSON: MapPin };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employee/projects" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{project.name}</h1>
            <Badge value={project.status} />
          </div>
          {project.client && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{project.client.companyName}</p>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Calendar className="w-4 h-4" /> Timeline
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
            {formatDate(project.startDate)} — {formatDate(project.endDate)}
          </p>
        </div>
        {project.accountManager && (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
              <User className="w-4 h-4" /> Account Manager
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {project.accountManager.firstName} {project.accountManager.lastName}
            </p>
          </div>
        )}
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <Target className="w-4 h-4" /> Milestones
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{initialMilestones.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
            <FolderKanban className="w-4 h-4" /> Tasks
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{tasks.length}</p>
        </div>
      </div>

      {/* Teams */}
      {project.projectTeams?.length > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#5542F6]" /> Teams
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {project.projectTeams.map((pt) => (
              <div key={pt.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50">{pt.team?.name}</h4>
                {pt.team?.lead && (
                  <p className="text-xs text-slate-400 mt-1">Lead: {pt.team.lead.firstName} {pt.team.lead.lastName}</p>
                )}
                <p className="text-xs text-slate-400">{pt.team?._count?.members || 0} members</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planning & Tasks */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Planning & Tasks</h2>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setPlanningView("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                planningView === "list" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setPlanningView("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                planningView === "kanban" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
        </div>

        {planningView === "list" ? (
          <PlanningSection
            projectId={project.id}
            initialSteps={initialSteps}
            initialMilestones={initialMilestones}
            initialTasks={tasks}
            assignableUsers={assignableUsers}
            showToast={showToast}
          />
        ) : (
          <KanbanBoard
            projectId={project.id}
            tasks={tasks}
            assignableUsers={assignableUsers}
            milestones={initialMilestones}
            planningSteps={initialSteps}
            onTaskUpdate={(taskId, data) => {
              setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...data } : t)));
            }}
            showToast={showToast}
          />
        )}
      </div>

      {/* Documents */}
      {initialDocuments.length > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5542F6]" /> Documents
          </h2>
          <div className="space-y-3">
            {initialDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{doc.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge value={doc.type} />
                    <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
                {doc.fileUrl && (
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meetings */}
      {initialMeetings.length > 0 && (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5542F6]" /> Meetings
          </h2>
          <div className="space-y-3">
            {initialMeetings.map((meeting) => {
              const ModeIcon = modeIcons[meeting.mode] || Video;
              const phase = meeting.phase || "REGULAR";
              const requirements = Array.isArray(meeting.requirements) ? meeting.requirements : [];
              const linkedTasks = (meeting.meetingTasks || []).map((mt) => mt.task).filter(Boolean);

              return (
                <div key={meeting.id} className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                        <ModeIcon className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{meeting.title}</h4>
                          {phase !== "REGULAR" && <Badge value={phase} />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge value={meeting.status} />
                          {meeting.duration && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="w-3 h-3" /> {meeting.duration} min
                            </span>
                          )}
                          {linkedTasks.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-indigo-500">
                              <ListChecks className="w-3 h-3" /> {linkedTasks.length} task{linkedTasks.length !== 1 ? "s" : ""}
                            </span>
                          )}
                          {requirements.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-sky-500">
                              <ClipboardList className="w-3 h-3" /> {requirements.length} req{requirements.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">{formatDateTime(meeting.scheduledAt)}</p>
                  </div>

                  {/* Requirements (esp. pre-production briefings the employee should read) */}
                  {requirements.length > 0 && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3 text-sky-500" /> Client Requirements
                      </p>
                      <div className="space-y-1.5">
                        {requirements.map((req, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{req.title}</p>
                              {req.priority && <Badge value={req.priority} />}
                            </div>
                            {req.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">{req.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
