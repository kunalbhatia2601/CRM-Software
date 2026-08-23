"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ListChecks,
  Search,
  Calendar,
  FolderKanban,
  Target,
  Layers,
  Loader2,
  MessageSquare,
  GitBranch,
  CornerDownRight,
  User,
  Lightbulb,
  Package,
  Link as LinkIcon,
  Video,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getMyTasks, updateTask } from "@/actions/tasks.action";
import Toast from "@/components/ui/Toast";
import SubmitWorkModal from "@/components/project/SubmitWorkModal";
import TaskWorkHistory from "@/components/project/TaskWorkHistory";
import TaskTimings from "@/components/project/TaskTimings";

// What the assignee can do next, by current status. Anything past IN_REVIEW
// belongs to a reviewer.
const ASSIGNEE_NEXT = {
  NEW: { status: "ACKNOWLEDGED", label: "Acknowledge" },
  ACKNOWLEDGED: { status: "IN_PROGRESS", label: "Start work" },
  IN_PROGRESS: { status: "IN_REVIEW", label: "Submit for review" },
};

const STATUSES = [
  { id: "ALL", label: "All" },
  { id: "NEW", label: "New" },
  { id: "ACKNOWLEDGED", label: "Acknowledged" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CLIENT_REVIEW", label: "Client Review" },
];

const PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function EmployeeTasksContent({ initialTasks = [] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState(null);
  const [advancingId, setAdvancingId] = useState(null);
  const [submitModal, setSubmitModal] = useState({ isOpen: false, task: null });
  const [submitting, setSubmitting] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("");
  // Deep link from the dashboard: /employee/tasks?task=<id> opens that task.
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState(searchParams.get("task"));

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter !== "ALL") filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      const result = await getMyTasks(filters);
      if (result.success) setTasks(result.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  /** Move one of my tasks along. Status-only payload: that is all I may change. */
  const advance = async (task, submission = null) => {
    const next = ASSIGNEE_NEXT[task.status];
    if (!next) return;

    // Handing work in needs the work attached, so collect it first.
    if (next.status === "IN_REVIEW" && !submission) {
      setSubmitModal({ isOpen: true, task });
      return;
    }

    setAdvancingId(task.id);
    const res = await updateTask(
      task.id,
      submission ? { status: next.status, submission } : { status: next.status }
    );
    setAdvancingId(null);
    setSubmitting(false);
    if (res.success) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...res.data } : t)));
      setSubmitModal({ isOpen: false, task: null });
      setToast({ type: "success", message: `Moved to ${next.status.replace(/_/g, " ").toLowerCase()}` });
    } else {
      setToast({ type: "error", message: res.error || "Failed to update task" });
    }
  };

  // Group tasks by status
  const groupedTasks = STATUSES.filter((s) => s.id !== "ALL").reduce((acc, status) => {
    acc[status.id] = tasks.filter((t) => t.status === status.id);
    return acc;
  }, {});

  const filteredTasks = statusFilter === "ALL" ? tasks : (groupedTasks[statusFilter] || []);

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <SubmitWorkModal
        isOpen={submitModal.isOpen}
        taskTitle={submitModal.task?.title || ""}
        saving={submitting}
        onClose={() => setSubmitModal({ isOpen: false, task: null })}
        onSubmit={(submission) => {
          setSubmitting(true);
          advance(submitModal.task, submission);
        }}
      />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">My Tasks</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">All tasks assigned to you across all projects.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 overflow-x-auto">
          {STATUSES.map((status) => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === status.id
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {status.label}
              {status.id !== "ALL" && (
                <span className="ml-1 text-[10px] text-slate-400">
                  ({(groupedTasks[status.id] || []).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
        >
          {PRIORITIES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const references = Array.isArray(task.references) ? task.references : [];
            const linkedMeetings = (task.meetingTasks || []).map((mt) => mt.meeting).filter(Boolean);
            const hasContent = task.objectives || task.deliverables || references.length > 0 || linkedMeetings.length > 0 || task.description;
            const isExpanded = expandedId === task.id;

            return (
              <div
                key={task.id}
                id={`task-${task.id}`}
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : task.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : task.id);
                  }
                }}
                className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${
                  isExpanded
                    ? "border-[#5542F6] shadow-md"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Parent task breadcrumb */}
                {task.parentTask && (
                  <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400">
                    <CornerDownRight className="w-3 h-3" />
                    <span>Follow-up of: {task.parentTask.title}</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">{task.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge value={task.status} />
                      <Badge value={task.priority} />
                      {ASSIGNEE_NEXT[task.status] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); advance(task); }}
                          disabled={advancingId === task.id}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-[#5542F6] hover:bg-[#4636d4] rounded-lg transition-colors disabled:opacity-60"
                        >
                          {advancingId === task.id ? "Saving…" : ASSIGNEE_NEXT[task.status].label}
                        </button>
                      )}
                      {task.project && (
                        <Link
                          onClick={(e) => e.stopPropagation()}
                          href={`/employee/projects/${task.project.id}`}
                          className="inline-flex items-center gap-1 text-xs text-[#5542F6] hover:underline"
                        >
                          <FolderKanban className="w-3 h-3" /> {task.project.name}
                        </Link>
                      )}
                      {task.milestone && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Target className="w-3 h-3" /> {task.milestone.title}
                        </span>
                      )}
                      {task.planningStep && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Layers className="w-3 h-3" /> {task.planningStep.title}
                        </span>
                      )}
                      {task.objectives && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Lightbulb className="w-3 h-3" /> Has objectives
                        </span>
                      )}
                      {linkedMeetings.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-sky-600">
                          <Video className="w-3 h-3" /> {linkedMeetings.length} meeting{linkedMeetings.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.feedbacks?.length > 0 && (
                      <span className="flex items-center gap-1 text-indigo-600">
                        <MessageSquare className="w-3.5 h-3.5" /> {task.feedbacks.length}
                      </span>
                    )}
                    {task.childTasks?.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <GitBranch className="w-3.5 h-3.5" /> {task.childTasks.length}
                      </span>
                    )}
                    <span
                      className="p-1 rounded-md text-slate-500"
                      title={isExpanded ? "Collapse" : "Show details"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Expandable content details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {!hasContent && (
                      <p className="text-sm text-slate-400 italic">No description or objectives were added to this task.</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {task.assignedBy && (
                        <span>Assigned by <span className="text-slate-700 dark:text-slate-300">{task.assignedBy.firstName} {task.assignedBy.lastName}</span></span>
                      )}
                      {task.dueDate && <span>Due {formatDate(task.dueDate)}</span>}
                      {task.completedAt && <span>Completed {formatDate(task.completedAt)}</span>}
                    </div>
                    {task.description && (
                      <div className="text-sm">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Description</span>
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mt-1">{task.description}</p>
                      </div>
                    )}
                    {task.objectives && (
                      <div className="flex items-start gap-2 text-sm">
                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Objectives</span>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.objectives}</p>
                        </div>
                      </div>
                    )}
                    {task.deliverables && (
                      <div className="flex items-start gap-2 text-sm">
                        <Package className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Deliverables</span>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{task.deliverables}</p>
                        </div>
                      </div>
                    )}
                    {references.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <LinkIcon className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">References</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {references.map((ref, idx) => (
                              <a
                                key={idx}
                                href={ref.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                              >
                                {ref.label}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {linkedMeetings.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Video className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Meetings</span>
                          <div className="flex flex-col gap-1.5 mt-1">
                            {linkedMeetings.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30"
                              >
                                <ClipboardList className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{m.title}</span>
                                {m.phase && m.phase !== "REGULAR" && <Badge value={m.phase} />}
                                <Badge value={m.status} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <TaskWorkHistory task={task} />
                    <TaskTimings task={task} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <ListChecks className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {statusFilter === "ALL" ? "No tasks assigned to you yet." : `No ${statusFilter.replace("_", " ").toLowerCase()} tasks.`}
          </p>
        </div>
      )}
    </div>
  );
}
