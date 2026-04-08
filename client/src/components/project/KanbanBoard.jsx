"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus,
  Calendar,
  Target,
  Layers,
  User,
  Loader2,
  X,
  MessageSquare,
  ArrowRight,
  GitBranch,
  CornerDownRight,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { updateTask } from "@/actions/tasks.action";

const COLUMN_STATUSES = [
  { id: "TODO", label: "TODO", headerColor: "bg-slate-100 dark:bg-slate-800" },
  { id: "IN_PROGRESS", label: "In Progress", headerColor: "bg-blue-100 dark:bg-blue-900" },
  { id: "IN_REVIEW", label: "In Review", headerColor: "bg-amber-100 dark:bg-amber-900" },
  { id: "COMPLETED", label: "Completed", headerColor: "bg-emerald-100 dark:bg-emerald-900" },
  { id: "REVIEWED", label: "Reviewed", headerColor: "bg-purple-100 dark:bg-purple-900" },
];

export default function KanbanBoard({
  projectId,
  tasks = [],
  assignableUsers = [],
  milestones = [],
  planningSteps = [],
  onTaskUpdate,
  onTaskCreate,
  showToast,
}) {
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Feedback modal for REVIEWED transitions
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, task: null, targetStatus: null });
  const [feedbackForm, setFeedbackForm] = useState({ feedback: "", nextStep: "" });
  const [savingFeedback, setSavingFeedback] = useState(false);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const tasksByStatus = COLUMN_STATUSES.reduce((acc, status) => {
    acc[status.id] = localTasks.filter((task) => task.status === status.id);
    return acc;
  }, {});

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget === e.target) setDragOverColumn(null);
  };

  const moveTask = async (taskId, status, extra = {}) => {
    setUpdatingTaskId(taskId);
    try {
      setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      const result = await updateTask(taskId, { status, ...extra });
      if (result.success) {
        setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? result.data : t)));
        if (onTaskUpdate) onTaskUpdate(taskId, { status });
        showToast?.("success", `Task moved to ${COLUMN_STATUSES.find((s) => s.id === status)?.label || status}`);
      } else {
        // Revert
        setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: draggedTask?.status || t.status } : t)));
        showToast?.("error", result.error || "Failed to update task");
      }
    } catch {
      setLocalTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: draggedTask?.status || t.status } : t)));
      showToast?.("error", "Failed to update task");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDrop = useCallback(
    async (e, columnStatus) => {
      e.preventDefault();
      setDragOverColumn(null);

      if (!draggedTask || draggedTask.status === columnStatus) {
        setDraggedTask(null);
        return;
      }

      // If dropping into REVIEWED, require feedback
      if (columnStatus === "REVIEWED") {
        setFeedbackModal({ isOpen: true, task: draggedTask, targetStatus: "REVIEWED" });
        setFeedbackForm({ feedback: "", nextStep: "" });
        setDraggedTask(null);
        return;
      }

      await moveTask(draggedTask.id, columnStatus);
      setDraggedTask(null);
    },
    [draggedTask, onTaskUpdate, showToast]
  );

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.feedback.trim()) {
      showToast?.("error", "Feedback is required when reviewing a task");
      return;
    }
    setSavingFeedback(true);
    try {
      const result = await updateTask(feedbackModal.task.id, {
        status: feedbackModal.targetStatus,
        feedback: feedbackForm.feedback,
        nextStep: feedbackForm.nextStep || null,
      });
      if (result.success) {
        setLocalTasks((prev) => prev.map((t) => (t.id === result.data.id ? result.data : t)));
        if (onTaskUpdate) onTaskUpdate(result.data.id, { status: feedbackModal.targetStatus });
        showToast?.("success", "Task reviewed with feedback");
        setFeedbackModal({ isOpen: false, task: null, targetStatus: null });
      } else {
        showToast?.("error", result.error || "Failed to review task");
      }
    } catch {
      showToast?.("error", "Failed to review task");
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleCreateTask = (status) => {
    if (onTaskCreate) onTaskCreate({ projectId, status });
  };

  const getUserInfo = (userId) => assignableUsers.find((u) => u.id === userId);
  const getMilestoneInfo = (milestoneId) => milestones.find((m) => m.id === milestoneId);
  const getPlanningStepInfo = (stepId) => planningSteps.find((s) => s.id === stepId);
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <>
      <div className="w-full h-full overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-min">
          {COLUMN_STATUSES.map((status) => {
            const columnTasks = tasksByStatus[status.id];
            const isHovered = dragOverColumn === status.id;

            return (
              <div
                key={status.id}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status.id)}
                className={`flex-shrink-0 w-[280px] rounded-2xl p-3 min-h-[200px] flex flex-col transition-all ${
                  isHovered
                    ? "bg-slate-100/80 dark:bg-slate-800/80 ring-2 ring-indigo-500"
                    : "bg-slate-50/50 dark:bg-slate-900/50"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 ${status.headerColor}`}>
                      {status.label}
                    </div>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCreateTask(status.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                    title={`Add task to ${status.label}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Task Cards */}
                <div className="flex flex-col gap-3 flex-1">
                  {columnTasks.length > 0 ? (
                    columnTasks.map((task) => {
                      const assignee = task.assignee || getUserInfo(task.assigneeId);
                      const milestone = task.milestone || getMilestoneInfo(task.milestoneId);
                      const planningStep = task.planningStep || getPlanningStepInfo(task.planningStepId);
                      const dueDate = formatDate(task.dueDate);
                      const isUpdating = updatingTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable={!isUpdating}
                          onDragStart={(e) => handleDragStart(e, task)}
                          className={`rounded-xl p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none hover:shadow-md transition-shadow group ${
                            isUpdating ? "opacity-60 cursor-wait" : "cursor-grab active:cursor-grabbing"
                          }`}
                        >
                          {/* Parent task breadcrumb */}
                          {task.parentTask && (
                            <div className="flex items-center gap-1 mb-2 text-[10px] text-slate-400">
                              <CornerDownRight size={10} />
                              <span className="truncate">Follow-up of: {task.parentTask.title}</span>
                            </div>
                          )}

                          <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2 text-sm leading-snug">
                            {task.title}
                            {isUpdating && <Loader2 className="inline w-3 h-3 ml-2 animate-spin text-slate-400" />}
                          </h3>

                          {task.priority && (
                            <div className="mb-3"><Badge value={task.priority} /></div>
                          )}

                          {assignee ? (
                            <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 dark:text-slate-400">
                              <div className="w-5 h-5 rounded-full bg-[#5542F6] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                                {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                              </div>
                              <span>{assignee.firstName} {assignee.lastName}</span>
                              {assignee.teams?.[0]?.name && (
                                <span className="text-[10px] text-slate-400">· {assignee.teams[0].name}</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                              <User size={14} /><span>Unassigned</span>
                            </div>
                          )}

                          {dueDate && (
                            <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 dark:text-slate-400">
                              <Calendar size={14} /><span>{dueDate}</span>
                            </div>
                          )}

                          {milestone && (
                            <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 dark:text-slate-400">
                              <Target size={14} /><span>{milestone.title}</span>
                            </div>
                          )}

                          {planningStep && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <Layers size={14} /><span>{planningStep.title}</span>
                            </div>
                          )}

                          {/* Activity indicators */}
                          {(task.feedbacks?.length > 0 || task.childTasks?.length > 0) && (
                            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                              {task.feedbacks?.length > 0 && (
                                <span className="flex items-center gap-1 text-indigo-600">
                                  <MessageSquare size={12} />
                                  {task.feedbacks.length} feedback{task.feedbacks.length !== 1 ? "s" : ""}
                                </span>
                              )}
                              {task.childTasks?.length > 0 && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <GitBranch size={12} />
                                  {task.childTasks.length} follow-up{task.childTasks.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-400 dark:text-slate-600">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Modal for REVIEWED drops */}
      {feedbackModal.isOpen && (
        <>
          <div onClick={() => setFeedbackModal({ isOpen: false, task: null, targetStatus: null })} className="fixed inset-0 bg-black/50 z-40" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-slate-950 rounded-[24px] shadow-2xl z-50 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Review Task</h2>
                <p className="text-xs text-slate-400 mt-0.5">{feedbackModal.task?.title}</p>
              </div>
              <button onClick={() => setFeedbackModal({ isOpen: false, task: null, targetStatus: null })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Feedback <span className="text-red-500">*</span></label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Provide your review feedback..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Next Step</label>
                <input
                  type="text"
                  value={feedbackForm.nextStep}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, nextStep: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
                  placeholder="What should happen next?"
                />
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 font-medium">
                Only the project Client, Owner, or Admin can submit reviews.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setFeedbackModal({ isOpen: false, task: null, targetStatus: null })}
                disabled={savingFeedback}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={savingFeedback || !feedbackForm.feedback.trim()}
                className="flex-1 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingFeedback && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingFeedback ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
