"use client";

import { useState, useTransition } from "react";
import {
  Video,
  MapPin,
  Phone,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ClipboardList,
  ListChecks,
  Flag,
} from "lucide-react";
import { createMeeting, updateMeeting, deleteMeeting } from "@/actions/meetings.action";
import Badge from "@/components/ui/Badge";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PostProductionReviewModal from "@/components/meetings/PostProductionReviewModal";
import { formatTime } from "@/lib/datetime";

const PHASE_OPTIONS = [
  { value: "REGULAR", label: "Regular" },
  { value: "KICKOFF", label: "Kickoff" },
  { value: "PRE_PRODUCTION", label: "Pre-Production" },
  { value: "POST_PRODUCTION", label: "Post-Production" },
  { value: "REVIEW", label: "Review" },
];

const PHASE_COLORS = {
  REGULAR: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  KICKOFF: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
  PRE_PRODUCTION: "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400",
  POST_PRODUCTION: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  REVIEW: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
};

const REQ_PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const MODE_ICONS = {
  VIRTUAL: Video,
  IN_PERSON: MapPin,
  PHONE_CALL: Phone,
};

const MODE_COLORS = {
  VIRTUAL: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30",
  IN_PERSON: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30",
  PHONE_CALL: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30",
};

const STATUS_ICONS = {
  SCHEDULED: Calendar,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
};

export default function MeetingsSection({
  meetings: initialMeetings = [],
  entityType, // "lead" | "deal" | "project"
  entityId,
  projectTasks = [], // Only used when entityType === "project" — to link meetings to specific tasks
  showToast,
}) {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reviewModalMeeting, setReviewModalMeeting] = useState(null);

  const emptyForm = {
    title: "",
    mode: "VIRTUAL",
    phase: "REGULAR",
    scheduledAt: "",
    duration: "",
    link: "",
    notes: "",
    description: "",
    requirements: [],
    taskIds: [],
  };

  const [form, setForm] = useState(emptyForm);

  const resetForm = () => {
    setForm(emptyForm);
  };

  const openCreate = () => {
    resetForm();
    setEditingMeeting(null);
    setShowCreateModal(true);
  };

  const openEdit = (meeting) => {
    setEditingMeeting(meeting);
    setForm({
      title: meeting.title || "",
      mode: meeting.mode || "VIRTUAL",
      phase: meeting.phase || "REGULAR",
      scheduledAt: meeting.scheduledAt ? new Date(meeting.scheduledAt).toISOString().slice(0, 16) : "",
      duration: meeting.duration || "",
      link: meeting.link || "",
      notes: meeting.notes || "",
      description: meeting.description || "",
      requirements: Array.isArray(meeting.requirements) ? meeting.requirements : [],
      taskIds: (meeting.meetingTasks || []).map((mt) => mt.taskId || mt.task?.id).filter(Boolean),
    });
    setShowCreateModal(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      showToast("error", "Meeting title is required");
      return;
    }
    if (!form.scheduledAt) {
      showToast("error", "Scheduled date/time is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        title: form.title.trim(),
        mode: form.mode,
        phase: form.phase || "REGULAR",
        scheduledAt: form.scheduledAt,
        [`${entityType}Id`]: entityId,
      };
      if (form.duration) payload.duration = parseInt(form.duration, 10);
      if (form.link) payload.link = form.link.trim();
      if (form.notes) payload.notes = form.notes.trim();
      if (form.description) payload.description = form.description.trim();

      // Requirements — drop empty rows
      const cleanedReqs = (form.requirements || [])
        .map((r) => ({
          title: r.title?.trim() || "",
          description: r.description?.trim() || null,
          priority: r.priority || undefined,
        }))
        .filter((r) => r.title);
      if (cleanedReqs.length > 0) payload.requirements = cleanedReqs;
      else if (editingMeeting) payload.requirements = null; // clear if edited to empty

      // Task linking — only valid when the meeting is tied to a project
      if (entityType === "project" && form.taskIds?.length > 0) {
        payload.taskIds = form.taskIds;
      } else if (editingMeeting && entityType === "project") {
        // explicit empty array = clear links on update
        payload.taskIds = [];
      }

      let result;
      if (editingMeeting) {
        // Don't send entity ID on update
        delete payload[`${entityType}Id`];
        result = await updateMeeting(editingMeeting.id, payload);
      } else {
        result = await createMeeting(payload);
      }

      if (result.success) {
        if (editingMeeting) {
          setMeetings((prev) => prev.map((m) => (m.id === result.data.id ? result.data : m)));
        } else {
          setMeetings((prev) => [result.data, ...prev]);
        }
        setShowCreateModal(false);
        resetForm();
        setEditingMeeting(null);
        showToast("success", editingMeeting ? "Meeting updated" : "Meeting scheduled");
      } else {
        showToast("error", result.error || "Failed to save meeting");
      }
    });
  };

  const handleStatusUpdate = (meetingId, newStatus) => {
    // Intercept completion of a POST_PRODUCTION meeting → open guided review modal
    if (newStatus === "COMPLETED") {
      const target = meetings.find((m) => m.id === meetingId);
      if (target?.phase === "POST_PRODUCTION") {
        setReviewModalMeeting(target);
        return;
      }
    }

    startTransition(async () => {
      const result = await updateMeeting(meetingId, { status: newStatus });
      if (result.success) {
        setMeetings((prev) => prev.map((m) => (m.id === result.data.id ? result.data : m)));
        showToast("success", `Meeting marked as ${newStatus.replace(/_/g, " ").toLowerCase()}`);
      } else {
        showToast("error", result.error || "Failed to update meeting");
      }
    });
  };

  // Requirement editor helpers
  const addRequirement = () => {
    setForm((prev) => ({
      ...prev,
      requirements: [...(prev.requirements || []), { title: "", description: "", priority: "MEDIUM" }],
    }));
  };
  const updateRequirement = (idx, field, value) => {
    setForm((prev) => {
      const next = [...(prev.requirements || [])];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, requirements: next };
    });
  };
  const removeRequirement = (idx) => {
    setForm((prev) => {
      const next = [...(prev.requirements || [])];
      next.splice(idx, 1);
      return { ...prev, requirements: next };
    });
  };

  const toggleTaskLink = (taskId) => {
    setForm((prev) => {
      const current = prev.taskIds || [];
      const next = current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId];
      return { ...prev, taskIds: next };
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteMeeting(deletingId);
      if (result.success) {
        setMeetings((prev) => prev.filter((m) => m.id !== deletingId));
        setDeletingId(null);
        showToast("success", "Meeting deleted");
      } else {
        showToast("error", result.error || "Failed to delete meeting");
      }
    });
  };

  const handleScheduleFollowUp = (parentMeeting) => {
    resetForm();
    setEditingMeeting(null);
    setForm((prev) => ({
      ...prev,
      title: `Follow-up: ${parentMeeting.title}`,
      mode: parentMeeting.mode,
    }));
    setShowCreateModal(true);
  };

  const upcoming = meetings.filter((m) => m.status === "SCHEDULED");
  const past = meetings.filter((m) => m.status !== "SCHEDULED");

  return (
    <>
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Meetings</h3>
              <p className="text-xs text-slate-400">{meetings.length} meeting{meetings.length !== 1 ? "s" : ""} scheduled</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No meetings scheduled yet.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Schedule your first meeting
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Upcoming</p>
                <div className="space-y-3">
                  {upcoming.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      expanded={expandedId === meeting.id}
                      onToggle={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                      onEdit={() => openEdit(meeting)}
                      onDelete={() => setDeletingId(meeting.id)}
                      onStatusUpdate={handleStatusUpdate}
                      onFollowUp={() => handleScheduleFollowUp(meeting)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Past</p>
                <div className="space-y-3">
                  {past.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      expanded={expandedId === meeting.id}
                      onToggle={() => setExpandedId(expandedId === meeting.id ? null : meeting.id)}
                      onEdit={() => openEdit(meeting)}
                      onDelete={() => setDeletingId(meeting.id)}
                      onStatusUpdate={handleStatusUpdate}
                      onFollowUp={() => handleScheduleFollowUp(meeting)}
                      isPending={isPending}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); setEditingMeeting(null); }} />
          <div className="relative bg-white dark:bg-slate-950 rounded-[24px] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {editingMeeting ? "Edit Meeting" : "Schedule Meeting"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {editingMeeting ? "Update meeting details" : "Add a new meeting"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <SettingsInput
                label="Title *"
                icon={Calendar}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Discovery call with client"
              />
              <SettingsSelect
                label="Mode"
                icon={Video}
                value={form.mode}
                onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}
                options={[
                  { value: "VIRTUAL", label: "Virtual (Video Call)" },
                  { value: "IN_PERSON", label: "In Person" },
                  { value: "PHONE_CALL", label: "Phone Call" },
                ]}
              />
              <SettingsSelect
                label="Phase"
                icon={Flag}
                value={form.phase}
                onChange={(e) => setForm((p) => ({ ...p, phase: e.target.value }))}
                options={PHASE_OPTIONS}
              />
              <SettingsInput
                label="Date & Time *"
                type="datetime-local"
                icon={Clock}
                value={form.scheduledAt}
                onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
              />
              <SettingsInput
                label="Duration (minutes)"
                type="number"
                icon={Clock}
                value={form.duration}
                onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                placeholder="e.g., 30"
              />
              <SettingsInput
                label={form.mode === "VIRTUAL" ? "Meeting Link" : form.mode === "PHONE_CALL" ? "Phone Number" : "Location"}
                icon={form.mode === "VIRTUAL" ? ExternalLink : form.mode === "PHONE_CALL" ? Phone : MapPin}
                value={form.link}
                onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))}
                placeholder={
                  form.mode === "VIRTUAL" ? "https://meet.google.com/..." : form.mode === "PHONE_CALL" ? "+1 234 567 8900" : "Office address"
                }
              />
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Meeting agenda or purpose..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
                />
              </div>

              {/* Requirements editor — especially for pre-production meetings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-sky-500" />
                    Requirements
                    {form.phase === "PRE_PRODUCTION" && <span className="text-[11px] text-sky-500 font-normal">(recommended)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                  >
                    <Plus className="w-3 h-3" /> Add Requirement
                  </button>
                </div>
                {(form.requirements || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    {form.phase === "PRE_PRODUCTION"
                      ? "Capture what the client is asking for in this briefing: scope, specific deliverables, brand guidelines."
                      : "Add structured requirements if relevant."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(form.requirements || []).map((req, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                        <div className="flex items-start gap-2 mb-2">
                          <input
                            type="text"
                            value={req.title || ""}
                            onChange={(e) => updateRequirement(idx, "title", e.target.value)}
                            placeholder="Requirement title"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          />
                          <select
                            value={req.priority || "MEDIUM"}
                            onChange={(e) => updateRequirement(idx, "priority", e.target.value)}
                            className="px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none"
                          >
                            {REQ_PRIORITY_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeRequirement(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={req.description || ""}
                          onChange={(e) => updateRequirement(idx, "description", e.target.value)}
                          placeholder="Details (optional)"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task linking — only available when attached to a project */}
              {entityType === "project" && projectTasks.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-indigo-500" />
                    Linked Tasks
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({(form.taskIds || []).length} selected)
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Link this meeting to specific tasks — useful for pre-production briefings and post-production reviews.
                  </p>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-2 space-y-1">
                    {projectTasks.map((task) => {
                      const checked = (form.taskIds || []).includes(task.id);
                      return (
                        <label
                          key={task.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${checked ? "bg-indigo-50 dark:bg-indigo-900/20" : "hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTaskLink(task.id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{task.title}</span>
                          <Badge value={task.status} />
                          <Badge value={task.priority} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setEditingMeeting(null); resetForm(); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !form.title.trim() || !form.scheduledAt}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#5542F6] rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : editingMeeting ? "Update Meeting" : "Schedule Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Post-Production Review Modal */}
      <PostProductionReviewModal
        isOpen={!!reviewModalMeeting}
        meeting={reviewModalMeeting}
        onClose={() => setReviewModalMeeting(null)}
        onComplete={(updatedMeeting) => {
          setMeetings((prev) => prev.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m)));
        }}
        showToast={showToast}
      />
    </>
  );
}

/* ─── Meeting Card ─── */
function MeetingCard({ meeting, expanded, onToggle, onEdit, onDelete, onStatusUpdate, onFollowUp, isPending }) {
  const ModeIcon = MODE_ICONS[meeting.mode] || Video;
  const StatusIcon = STATUS_ICONS[meeting.status] || Calendar;
  const modeColor = MODE_COLORS[meeting.mode] || MODE_COLORS.VIRTUAL;
  const phase = meeting.phase || "REGULAR";
  const phaseColor = PHASE_COLORS[phase] || PHASE_COLORS.REGULAR;
  const phaseLabel = PHASE_OPTIONS.find((p) => p.value === phase)?.label || "Regular";

  const scheduledDate = new Date(meeting.scheduledAt);
  const dateStr = scheduledDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = formatTime(scheduledDate);
  const isPast = scheduledDate < new Date() && meeting.status === "SCHEDULED";

  const requirements = Array.isArray(meeting.requirements) ? meeting.requirements : [];
  const linkedTasks = (meeting.meetingTasks || []).map((mt) => mt.task).filter(Boolean);

  return (
    <div className={`rounded-xl border transition-colors ${isPast ? "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/30" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-200"}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${modeColor}`}>
            <ModeIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{meeting.title}</p>
              {phase !== "REGULAR" && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${phaseColor}`}>
                  {phaseLabel}
                </span>
              )}
              {meeting.isFollowUp && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  Follow-up
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeStr}
              </span>
              {meeting.duration && <span>{meeting.duration} min</span>}
              <Badge value={meeting.status} />
              {linkedTasks.length > 0 && (
                <span className="flex items-center gap-1 text-indigo-500">
                  <ListChecks className="w-3 h-3" />
                  {linkedTasks.length} task{linkedTasks.length !== 1 ? "s" : ""}
                </span>
              )}
              {requirements.length > 0 && (
                <span className="flex items-center gap-1 text-sky-500">
                  <ClipboardList className="w-3 h-3" />
                  {requirements.length} req{requirements.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {isPast && meeting.status === "SCHEDULED" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Overdue</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
          <div className="mt-4 space-y-3">
            {meeting.description && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meeting.description}</p>
              </div>
            )}
            {meeting.link && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {meeting.mode === "VIRTUAL" ? "Meeting Link" : meeting.mode === "PHONE_CALL" ? "Phone Number" : "Location"}
                </p>
                {meeting.mode === "VIRTUAL" ? (
                  <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {meeting.link}
                  </a>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{meeting.link}</p>
                )}
              </div>
            )}
            {meeting.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meeting.notes}</p>
              </div>
            )}
            {meeting.outcome && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Outcome</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meeting.outcome}</p>
              </div>
            )}
            {meeting.createdBy && (
              <p className="text-xs text-slate-400">
                Created by {meeting.createdBy.firstName} {meeting.createdBy.lastName}
              </p>
            )}

            {/* Requirements (esp. pre-production) */}
            {requirements.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ClipboardList className="w-3 h-3 text-sky-500" />
                  Requirements ({requirements.length})
                </p>
                <div className="space-y-2">
                  {requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{req.title}</p>
                        {req.priority && <Badge value={req.priority} />}
                      </div>
                      {req.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{req.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Linked tasks */}
            {linkedTasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ListChecks className="w-3 h-3 text-indigo-500" />
                  Linked Tasks ({linkedTasks.length})
                </p>
                <div className="space-y-1.5">
                  {linkedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{task.title}</span>
                      <Badge value={task.status} />
                      <Badge value={task.priority} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up meetings */}
            {meeting.followUpMeetings && meeting.followUpMeetings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Follow-up Meetings</p>
                <div className="space-y-1">
                  {meeting.followUpMeetings.map((fu) => (
                    <div key={fu.id} className="flex items-center gap-2 text-xs text-slate-500">
                      <RefreshCw className="w-3 h-3" />
                      <span>{fu.title}</span>
                      <Badge value={fu.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            {meeting.status === "SCHEDULED" && (
              <>
                <button
                  onClick={() => onStatusUpdate(meeting.id, "COMPLETED")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete
                </button>
                <button
                  onClick={() => onStatusUpdate(meeting.id, "CANCELLED")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={() => onStatusUpdate(meeting.id, "NO_SHOW")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  No Show
                </button>
              </>
            )}
            <button
              onClick={onFollowUp}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-500/10 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Follow-up Meeting
            </button>
            <button
              onClick={onEdit}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
