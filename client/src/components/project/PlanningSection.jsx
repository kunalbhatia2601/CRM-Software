"use client";

import React, { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Target,
  ListChecks,
  Layers,
  Pencil,
  Trash2,
  Calendar,
  User,
  Clock,
  X,
  Loader2,
  MessageSquare,
  MessageCircle,
  ArrowRight,
  GitBranch,
  CornerDownRight,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  createPlanningStep,
  updatePlanningStep,
  deletePlanningStep,
} from "@/actions/planning-steps.action";
import { createTask, updateTask, deleteTask } from "@/actions/tasks.action";
import {
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "@/actions/milestones.action";
import CommentThread from "@/components/project/CommentThread";

export default function PlanningSection({
  projectId,
  initialSteps = [],
  initialMilestones = [],
  initialTasks = [],
  assignableUsers = [],
  showToast,
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [tasks, setTasks] = useState(initialTasks);

  // Accordion state
  const [expandedSections, setExpandedSections] = useState({
    milestones: true,
    steps: true,
    tasks: true,
  });

  // Modal states
  const [milestonesModal, setMilestonesModal] = useState({ isOpen: false, mode: "create", data: null });
  const [stepsModal, setStepsModal] = useState({ isOpen: false, mode: "create", data: null });
  const [tasksModal, setTasksModal] = useState({ isOpen: false, mode: "create", data: null });

  // Loading states
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [savingTask, setSavingTask] = useState(false);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: null, id: null, loading: false });

  // Feedback modal — for review actions
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, taskId: null, taskTitle: "" });
  const [feedbackForm, setFeedbackForm] = useState({ feedback: "", nextStep: "", statusAfter: "REVIEWED" });
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Task detail/feedbacks view
  const [viewingTask, setViewingTask] = useState(null);

  // Comment thread toggles
  const [commentingOn, setCommentingOn] = useState(null); // { type: 'TASK'|'MILESTONE'|'PLANNING_STEP', id: '...' }

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getTaskCount = (entityId, entityType) => {
    if (entityType === "milestone") return tasks.filter((t) => t.milestoneId === entityId).length;
    if (entityType === "step") return tasks.filter((t) => t.planningStepId === entityId).length;
    return 0;
  };

  const getMilestoneName = (id) => milestones.find((m) => m.id === id)?.title || "-";
  const getStepName = (id) => steps.find((s) => s.id === id)?.title || "-";
  const getAssigneeInfo = (userId) => assignableUsers.find((u) => u.id === userId);

  const getInitials = (user) => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  const getFullName = (user) => {
    if (!user) return "Unassigned";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  };

  const getTeamName = (user) => {
    if (!user?.teams?.length) return null;
    return user.teams[0].name;
  };

  const toggleComments = (type, id) => {
    if (commentingOn?.type === type && commentingOn?.id === id) {
      setCommentingOn(null);
    } else {
      setCommentingOn({ type, id });
    }
  };

  // Open task modal for creating a follow-up task
  const openFollowUpModal = (parentTask) => {
    setTasksModal({
      isOpen: true,
      mode: "create",
      data: {
        title: "",
        description: "",
        status: "TODO",
        priority: parentTask.priority || "MEDIUM",
        assigneeId: parentTask.assigneeId || "",
        dueDate: "",
        planningStepId: parentTask.planningStepId || "",
        milestoneId: parentTask.milestoneId || "",
        parentTaskId: parentTask.id,
        parentTaskTitle: parentTask.title,
      },
    });
  };

  // ============ MILESTONE HANDLERS ============
  const openMilestoneModal = (milestone = null) => {
    setMilestonesModal({
      isOpen: true,
      mode: milestone ? "edit" : "create",
      data: milestone || { title: "", description: "", status: "PENDING", dueDate: "" },
    });
  };

  const closeMilestoneModal = () => setMilestonesModal({ isOpen: false, mode: "create", data: null });

  const handleSaveMilestone = async (formData) => {
    setSavingMilestone(true);
    try {
      if (milestonesModal.mode === "create") {
        const result = await createMilestone({ ...formData, projectId });
        if (result.success) {
          setMilestones([...milestones, result.data]);
          showToast("success", "Milestone created successfully");
          closeMilestoneModal();
        } else {
          showToast("error", result.error || "Failed to create milestone");
        }
      } else {
        const result = await updateMilestone(milestonesModal.data.id, formData);
        if (result.success) {
          setMilestones(milestones.map((m) => (m.id === result.data.id ? result.data : m)));
          showToast("success", "Milestone updated successfully");
          closeMilestoneModal();
        } else {
          showToast("error", result.error || "Failed to update milestone");
        }
      }
    } catch (error) {
      showToast("error", "An error occurred");
    } finally {
      setSavingMilestone(false);
    }
  };

  const handleDeleteMilestone = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await deleteMilestone(confirmModal.id);
      if (result.success) {
        setMilestones(milestones.filter((m) => m.id !== confirmModal.id));
        showToast("success", "Milestone deleted");
      } else {
        showToast("error", result.error || "Failed to delete milestone");
      }
    } catch (error) {
      showToast("error", "An error occurred");
    } finally {
      setConfirmModal({ isOpen: false, type: null, id: null, loading: false });
    }
  };

  // ============ PLANNING STEP HANDLERS ============
  const openStepModal = (step = null) => {
    setStepsModal({
      isOpen: true,
      mode: step ? "edit" : "create",
      data: step || { title: "", description: "", status: "PENDING", startDate: "", endDate: "" },
    });
  };

  const closeStepModal = () => setStepsModal({ isOpen: false, mode: "create", data: null });

  const handleSaveStep = async (formData) => {
    setSavingStep(true);
    try {
      if (stepsModal.mode === "create") {
        const result = await createPlanningStep({ ...formData, projectId });
        if (result.success) {
          setSteps([...steps, result.data]);
          showToast("success", "Planning step created");
          closeStepModal();
        } else {
          showToast("error", result.error || "Failed to create planning step");
        }
      } else {
        const result = await updatePlanningStep(stepsModal.data.id, formData);
        if (result.success) {
          setSteps(steps.map((s) => (s.id === result.data.id ? result.data : s)));
          showToast("success", "Planning step updated");
          closeStepModal();
        } else {
          showToast("error", result.error || "Failed to update planning step");
        }
      }
    } catch (error) {
      showToast("error", "An error occurred");
    } finally {
      setSavingStep(false);
    }
  };

  const handleDeleteStep = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await deletePlanningStep(confirmModal.id);
      if (result.success) {
        setSteps(steps.filter((s) => s.id !== confirmModal.id));
        showToast("success", "Planning step deleted");
      } else {
        showToast("error", result.error || "Failed to delete planning step");
      }
    } catch (error) {
      showToast("error", "An error occurred");
    } finally {
      setConfirmModal({ isOpen: false, type: null, id: null, loading: false });
    }
  };

  // ============ TASK HANDLERS ============
  const openTaskModal = (task = null) => {
    setTasksModal({
      isOpen: true,
      mode: task ? "edit" : "create",
      data: task || { title: "", description: "", status: "TODO", priority: "MEDIUM", assigneeId: "", dueDate: "", planningStepId: "", milestoneId: "" },
    });
  };

  const closeTaskModal = () => setTasksModal({ isOpen: false, mode: "create", data: null });

  const handleSaveTask = async (formData) => {
    setSavingTask(true);
    try {
      if (tasksModal.mode === "create") {
        const result = await createTask({ ...formData, projectId });
        if (result.success) {
          setTasks([...tasks, result.data]);
          showToast("success", "Task created");
          closeTaskModal();
        } else {
          showToast("error", result.error || "Failed to create task");
        }
      } else {
        const result = await updateTask(tasksModal.data.id, formData);
        if (result.success) {
          setTasks(tasks.map((t) => (t.id === result.data.id ? result.data : t)));
          showToast("success", "Task updated");
          closeTaskModal();
        } else {
          showToast("error", result.error || "Failed to update task");
        }
      }
    } catch (error) {
      showToast("error", "An error occurred");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    setConfirmModal((prev) => ({ ...prev, loading: true }));
    try {
      const result = await deleteTask(confirmModal.id);
      if (result.success) {
        setTasks(tasks.filter((t) => t.id !== confirmModal.id));
        showToast("success", "Task deleted");
      } else {
        showToast("error", result.error || "Failed to delete task");
      }
    } catch (error) {
      showToast("error", "An error occurred");
    } finally {
      setConfirmModal({ isOpen: false, type: null, id: null, loading: false });
    }
  };

  // ============ FEEDBACK / REVIEW HANDLERS ============
  const openFeedbackModal = (task) => {
    setFeedbackModal({ isOpen: true, taskId: task.id, taskTitle: task.title });
    setFeedbackForm({ feedback: "", nextStep: "", statusAfter: "REVIEWED" });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({ isOpen: false, taskId: null, taskTitle: "" });
    setFeedbackForm({ feedback: "", nextStep: "", statusAfter: "REVIEWED" });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.feedback.trim()) {
      showToast("error", "Feedback is required");
      return;
    }
    setSavingFeedback(true);
    try {
      const result = await updateTask(feedbackModal.taskId, {
        status: feedbackForm.statusAfter,
        feedback: feedbackForm.feedback,
        nextStep: feedbackForm.nextStep || null,
      });
      if (result.success) {
        setTasks(tasks.map((t) => (t.id === result.data.id ? result.data : t)));
        showToast("success", "Feedback submitted & task updated");
        closeFeedbackModal();
      } else {
        showToast("error", result.error || "Failed to submit feedback");
      }
    } catch (error) {
      showToast("error", "An error occurred");
    } finally {
      setSavingFeedback(false);
    }
  };

  // ============ RENDER COMPONENTS ============

  const MilestoneCard = ({ milestone }) => (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-50">{milestone.title}</h4>
          <div className="mt-1"><Badge value={milestone.status} /></div>
        </div>
        <button onClick={() => openMilestoneModal(milestone)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
      {milestone.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{milestone.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        {milestone.dueDate && (
          <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(milestone.dueDate)}</div>
        )}
        <div className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" />{getTaskCount(milestone.id, "milestone")} tasks</div>
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button onClick={() => openMilestoneModal(milestone)} className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">Edit</button>
        <button onClick={() => toggleComments("MILESTONE", milestone.id)} className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" /> Chat
        </button>
        <button onClick={() => setConfirmModal({ isOpen: true, type: "milestone", id: milestone.id, loading: false })} className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Delete</button>
      </div>
      {commentingOn?.type === "MILESTONE" && commentingOn?.id === milestone.id && (
        <CommentThread entityType="MILESTONE" entityId={milestone.id} showToast={showToast} />
      )}
    </div>
  );

  const StepCard = ({ step }) => (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-50">{step.title}</h4>
          <div className="mt-1"><Badge value={step.status} /></div>
        </div>
        <button onClick={() => openStepModal(step)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>
      {step.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{step.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        {step.startDate && (<div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(step.startDate)}</div>)}
        {step.endDate && (<div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(step.endDate)}</div>)}
        <div className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5" />{getTaskCount(step.id, "step")} tasks</div>
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button onClick={() => openStepModal(step)} className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">Edit</button>
        <button onClick={() => toggleComments("PLANNING_STEP", step.id)} className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
          <MessageCircle className="w-3.5 h-3.5" /> Chat
        </button>
        <button onClick={() => setConfirmModal({ isOpen: true, type: "step", id: step.id, loading: false })} className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Delete</button>
      </div>
      {commentingOn?.type === "PLANNING_STEP" && commentingOn?.id === step.id && (
        <CommentThread entityType="PLANNING_STEP" entityId={step.id} showToast={showToast} />
      )}
    </div>
  );

  const TaskRow = ({ task }) => {
    const assignee = task.assignee || getAssigneeInfo(task.assigneeId);
    const feedbacks = task.feedbacks || [];
    const childTasks = task.childTasks || [];
    const teamName = getTeamName(assignee || getAssigneeInfo(task.assigneeId));

    return (
      <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 mb-3">
        {/* Parent task breadcrumb */}
        {task.parentTask && (
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400">
            <CornerDownRight className="w-3 h-3" />
            <span>Follow-up of:</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">{task.parentTask.title}</span>
            <Badge value={task.parentTask.status} />
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">{task.title}</h4>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge value={task.status} />
              <Badge value={task.priority} />
              {feedbacks.length > 0 && (
                <button
                  onClick={() => setViewingTask(viewingTask === task.id ? null : task.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <MessageSquare className="w-3 h-3" />
                  {feedbacks.length} feedback{feedbacks.length !== 1 ? "s" : ""}
                </button>
              )}
              {childTasks.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <GitBranch className="w-3 h-3" />
                  {childTasks.length} follow-up{childTasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => openFollowUpModal(task)}
              className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              title="Create follow-up task"
            >
              <GitBranch className="w-4 h-4 text-emerald-600" />
            </button>
            {task.status === "COMPLETED" && (
              <button
                onClick={() => openFeedbackModal(task)}
                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                title="Review with feedback"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </button>
            )}
            <button onClick={() => openTaskModal(task)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Pencil className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400 mb-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          {task.dueDate && (<div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" />{formatDate(task.dueDate)}</div>)}
          {assignee && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#5542F6] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">{getInitials(assignee)}</div>
              <span className="truncate">{getFullName(assignee)}</span>
              {teamName && <span className="text-[10px] text-slate-400 flex-shrink-0">· {teamName}</span>}
            </div>
          )}
          {task.milestoneId && (<div className="flex items-center gap-2"><Target className="w-4 h-4 flex-shrink-0" /><span className="truncate">{getMilestoneName(task.milestoneId)}</span></div>)}
          {task.planningStepId && (<div className="flex items-center gap-2"><Layers className="w-4 h-4 flex-shrink-0" /><span className="truncate">{getStepName(task.planningStepId)}</span></div>)}
        </div>

        {/* Child tasks / follow-ups */}
        {childTasks.length > 0 && (
          <div className="mb-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" /> Follow-up Tasks
            </h5>
            <div className="space-y-1.5">
              {childTasks.map((child) => (
                <div key={child.id} className="flex items-center gap-2 pl-3 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <CornerDownRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{child.title}</span>
                  <Badge value={child.status} />
                  {child.assignee && (
                    <div className="w-5 h-5 rounded-full bg-[#5542F6] text-white text-[8px] font-bold flex items-center justify-center flex-shrink-0">
                      {child.assignee.firstName?.[0]}{child.assignee.lastName?.[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedbacks timeline */}
        {viewingTask === task.id && feedbacks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Feedback History
            </h5>
            <div className="space-y-3">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="relative pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {fb.givenBy ? `${fb.givenBy.firstName} ${fb.givenBy.lastName}` : "Unknown"}
                    </span>
                    <Badge value={fb.givenBy?.role || "UNKNOWN"} />
                    <span className="text-[10px] text-slate-400">{formatDate(fb.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{fb.feedback}</p>
                  {fb.nextStep && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                      <ArrowRight className="w-3 h-3" /> Next: {fb.nextStep}
                    </div>
                  )}
                  <div className="mt-1">
                    <span className="text-[10px] text-slate-400">Status set to: </span>
                    <Badge value={fb.statusAfter} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button onClick={() => openTaskModal(task)} className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">Edit</button>
          <button onClick={() => toggleComments("TASK", task.id)} className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" /> Chat
          </button>
          <button onClick={() => setConfirmModal({ isOpen: true, type: "task", id: task.id, loading: false })} className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Delete</button>
        </div>

        {/* Comment thread */}
        {commentingOn?.type === "TASK" && commentingOn?.id === task.id && (
          <CommentThread entityType="TASK" entityId={task.id} showToast={showToast} />
        )}
      </div>
    );
  };

  const EmptyState = ({ icon: Icon, title, onCreateClick }) => (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-12 text-center">
      <Icon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
      <p className="text-slate-600 dark:text-slate-400 mb-4">{title}</p>
      <button onClick={onCreateClick} className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-colors">
        <Plus className="w-4 h-4" /> Create
      </button>
    </div>
  );

  const AccordionSection = ({ title, icon: Icon, expanded, onToggle, onCreateClick, children }) => (
    <div className="rounded-[24px] bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 overflow-hidden">
      <button onClick={onToggle} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#5542F6]" />
          <span className="font-semibold text-slate-900 dark:text-slate-50">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onCreateClick(); }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5542F6] text-white text-xs font-semibold rounded-xl hover:bg-[#4636d4] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
          {expanded ? <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
        </div>
      </button>
      {expanded && <div className="p-6">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* MILESTONES */}
      <AccordionSection title="Milestones" icon={Target} expanded={expandedSections.milestones}
        onToggle={() => setExpandedSections({ ...expandedSections, milestones: !expandedSections.milestones })}
        onCreateClick={() => openMilestoneModal()}
      >
        {milestones.length === 0 ? (
          <EmptyState icon={Target} title="No milestones yet. Create one to get started." onCreateClick={() => openMilestoneModal()} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((m) => <MilestoneCard key={m.id} milestone={m} />)}
          </div>
        )}
      </AccordionSection>

      {/* PLANNING STEPS */}
      <AccordionSection title="Planning Steps" icon={Layers} expanded={expandedSections.steps}
        onToggle={() => setExpandedSections({ ...expandedSections, steps: !expandedSections.steps })}
        onCreateClick={() => openStepModal()}
      >
        {steps.length === 0 ? (
          <EmptyState icon={Layers} title="No planning steps yet. Create one to organize your project." onCreateClick={() => openStepModal()} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((s) => <StepCard key={s.id} step={s} />)}
          </div>
        )}
      </AccordionSection>

      {/* TASKS */}
      <AccordionSection title="Tasks" icon={ListChecks} expanded={expandedSections.tasks}
        onToggle={() => setExpandedSections({ ...expandedSections, tasks: !expandedSections.tasks })}
        onCreateClick={() => openTaskModal()}
      >
        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks yet. Create one to get started." onCreateClick={() => openTaskModal()} />
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => <TaskRow key={t.id} task={t} />)}
          </div>
        )}
      </AccordionSection>

      {/* MILESTONE MODAL */}
      <MilestoneModal isOpen={milestonesModal.isOpen} onClose={closeMilestoneModal} onSave={handleSaveMilestone} mode={milestonesModal.mode} data={milestonesModal.data} saving={savingMilestone} />

      {/* STEP MODAL */}
      <StepModal isOpen={stepsModal.isOpen} onClose={closeStepModal} onSave={handleSaveStep} mode={stepsModal.mode} data={stepsModal.data} saving={savingStep} />

      {/* TASK MODAL */}
      <TaskModal isOpen={tasksModal.isOpen} onClose={closeTaskModal} onSave={handleSaveTask} mode={tasksModal.mode} data={tasksModal.data} steps={steps} milestones={milestones} assignableUsers={assignableUsers} saving={savingTask} />

      {/* FEEDBACK / REVIEW MODAL */}
      {feedbackModal.isOpen && (
        <>
          <div onClick={closeFeedbackModal} className="fixed inset-0 bg-black/50 z-40" />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-950 shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Review Task</h2>
                <p className="text-xs text-slate-400 mt-0.5">{feedbackModal.taskTitle}</p>
              </div>
              <button onClick={closeFeedbackModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Feedback <span className="text-red-500">*</span></label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
                  rows={4}
                  placeholder="Provide your feedback on this task..."
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
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Set Status To</label>
                <select
                  value={feedbackForm.statusAfter}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, statusAfter: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
                >
                  <option value="REVIEWED">Reviewed (Approved)</option>
                  <option value="TODO">Back to Todo</option>
                  <option value="IN_PROGRESS">Back to In Progress</option>
                  <option value="IN_REVIEW">Back to In Review</option>
                  <option value="COMPLETED">Keep Completed</option>
                </select>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 font-medium">
                Only the project Client, Owner, or Admin can submit reviews. Feedback is required.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={closeFeedbackModal} disabled={savingFeedback} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Cancel</button>
              <button
                onClick={handleSubmitFeedback}
                disabled={savingFeedback || !feedbackForm.feedback.trim()}
                className="flex-1 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingFeedback && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingFeedback ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* CONFIRM DELETE */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, id: null, loading: false })}
        onConfirm={() => {
          if (confirmModal.type === "milestone") handleDeleteMilestone();
          else if (confirmModal.type === "step") handleDeleteStep();
          else if (confirmModal.type === "task") handleDeleteTask();
        }}
        title="Delete Item"
        message={`Are you sure you want to delete this ${confirmModal.type}? This action cannot be undone.`}
        confirmLabel="Delete"
        isPending={confirmModal.loading}
        variant="danger"
      />
    </div>
  );
}

// ============ MODAL COMPONENTS ============

function MilestoneModal({ isOpen, onClose, onSave, mode, data, saving }) {
  const [formData, setFormData] = React.useState({});

  React.useEffect(() => {
    if (isOpen && data) setFormData(data);
  }, [isOpen, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <SlideOverModal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Create Milestone" : "Edit Milestone"} onSubmit={handleSubmit} saving={saving}>
      <div className="space-y-4">
        <FormField label="Title" type="text" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        <FormField label="Description" type="textarea" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <FormField label="Status" type="select" value={formData.status || "PENDING"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ value: "PENDING", label: "Pending" }, { value: "IN_PROGRESS", label: "In Progress" }, { value: "COMPLETED", label: "Completed" }]} />
        <FormField label="Due Date" type="date" value={formData.dueDate ? formData.dueDate.split("T")[0] : ""} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
      </div>
    </SlideOverModal>
  );
}

function StepModal({ isOpen, onClose, onSave, mode, data, saving }) {
  const [formData, setFormData] = React.useState({});

  React.useEffect(() => {
    if (isOpen && data) setFormData(data);
  }, [isOpen, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <SlideOverModal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Create Planning Step" : "Edit Planning Step"} onSubmit={handleSubmit} saving={saving}>
      <div className="space-y-4">
        <FormField label="Title" type="text" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        <FormField label="Description" type="textarea" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <FormField label="Status" type="select" value={formData.status || "PENDING"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[{ value: "PENDING", label: "Pending" }, { value: "IN_PROGRESS", label: "In Progress" }, { value: "COMPLETED", label: "Completed" }]} />
        <FormField label="Start Date" type="date" value={formData.startDate ? formData.startDate.split("T")[0] : ""} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
        <FormField label="End Date" type="date" value={formData.endDate ? formData.endDate.split("T")[0] : ""} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
      </div>
    </SlideOverModal>
  );
}

function TaskModal({ isOpen, onClose, onSave, mode, data, steps, milestones, assignableUsers, saving }) {
  const [formData, setFormData] = React.useState({});

  React.useEffect(() => {
    if (isOpen && data) setFormData(data);
  }, [isOpen, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Strip UI-only fields before saving
    const { parentTaskTitle, ...submitData } = formData;
    onSave(submitData);
  };

  if (!isOpen) return null;

  const getTeamLabel = (user) => {
    if (!user?.teams?.length) return "";
    return ` (${user.teams[0].name})`;
  };

  return (
    <SlideOverModal isOpen={isOpen} onClose={onClose} title={mode === "create" ? (formData.parentTaskId ? "Create Follow-up Task" : "Create Task") : "Edit Task"} onSubmit={handleSubmit} saving={saving}>
      <div className="space-y-4">
        {/* Show parent task info if creating a follow-up */}
        {formData.parentTaskId && formData.parentTaskTitle && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <GitBranch className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="text-emerald-700 dark:text-emerald-300 font-medium">Follow-up of: </span>
              <span className="text-emerald-600 dark:text-emerald-400">{formData.parentTaskTitle}</span>
            </div>
          </div>
        )}
        <FormField label="Title" type="text" value={formData.title || ""} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
        <FormField label="Description" type="textarea" value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        <FormField label="Status" type="select" value={formData.status || "TODO"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={[
          { value: "TODO", label: "To Do" }, { value: "IN_PROGRESS", label: "In Progress" }, { value: "IN_REVIEW", label: "In Review" }, { value: "COMPLETED", label: "Completed" }, { value: "REVIEWED", label: "Reviewed" },
        ]} />
        <FormField label="Priority" type="select" value={formData.priority || "MEDIUM"} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} options={[
          { value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }, { value: "URGENT", label: "Urgent" },
        ]} />
        <FormField label="Assignee" type="select" value={formData.assigneeId || ""} onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })} options={[
          { value: "", label: "Select an assignee" },
          ...assignableUsers.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}${getTeamLabel(u)}` })),
        ]} />
        <FormField label="Due Date" type="date" value={formData.dueDate ? formData.dueDate.split("T")[0] : ""} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
        <FormField label="Planning Step" type="select" value={formData.planningStepId || ""} onChange={(e) => setFormData({ ...formData, planningStepId: e.target.value })} options={[
          { value: "", label: "Select a planning step (optional)" },
          ...steps.map((s) => ({ value: s.id, label: s.title })),
        ]} />
        <FormField label="Milestone" type="select" value={formData.milestoneId || ""} onChange={(e) => setFormData({ ...formData, milestoneId: e.target.value })} options={[
          { value: "", label: "Select a milestone (optional)" },
          ...milestones.map((m) => ({ value: m.id, label: m.title })),
        ]} />
      </div>
    </SlideOverModal>
  );
}

function SlideOverModal({ isOpen, onClose, title, onSubmit, saving, children }) {
  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/50 z-40 transition-opacity" />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-950 shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        <form id="slide-over-form" onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-4">{children}</form>
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onClose} disabled={saving} className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">Cancel</button>
          <button
            type="submit"
            form="slide-over-form"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}

function FormField({ label, type, value, onChange, required, options }) {
  const baseInputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none";

  return (
    <div>
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {type === "textarea" ? (
        <textarea value={value} onChange={onChange} className={baseInputClass} rows={4} />
      ) : type === "select" ? (
        <select value={value} onChange={onChange} className={baseInputClass}>
          {options.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} className={baseInputClass} required={required} />
      )}
    </div>
  );
}
