"use client";

import { useState, useEffect, useTransition, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Users2,
  UserCheck,
  FolderKanban,
  Shield,
  Plus,
  X,
  Loader2,
  Crown,
  Search,
  ExternalLink,
  Layers,
  Target,
  ListChecks,
} from "lucide-react";
import {
  getTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberPermissions,
  getTeamMembers,
} from "@/actions/teams.action";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function TeamDetailContent({ initialTeam }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [team, setTeam] = useState(initialTeam);
  const [toast, setToast] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const addDropdownRef = useRef(null);

  const [removeModal, setRemoveModal] = useState({ open: false, member: null });
  const [isRemoving, setIsRemoving] = useState(false);

  const [permissionsModal, setPermissionsModal] = useState({
    open: false,
    member: null,
    permissions: {},
  });
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  useEffect(() => {
    getTeamMembers().then((result) => {
      if (result.success) setAvailableUsers(result.data || []);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
        setShowAddDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const members = team.members || [];
  const projectTeams = team.projectTeams || [];
  const memberUserIds = members.map((m) => m.user?.id);

  // Filter available users for add dropdown
  const filteredAddUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      if (memberUserIds.includes(u.id)) return false;
      if (!memberSearch) return true;
      const q = memberSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().replace(/_/g, " ").includes(q)
      );
    });
  }, [availableUsers, memberUserIds, memberSearch]);

  const getInitials = (firstName, lastName) =>
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  const refreshTeam = async () => {
    const refreshed = await getTeam(team.id);
    if (refreshed.success) setTeam(refreshed.data);
  };

  const handleAddMember = async (userId) => {
    setShowAddDropdown(false);
    setMemberSearch("");
    startTransition(async () => {
      const result = await addTeamMember(team.id, { userId });
      if (result.success) {
        await refreshTeam();
        showToast("success", "Member added successfully");
      } else {
        showToast("error", result.error || "Failed to add member");
      }
    });
  };

  const handleRemoveMember = async () => {
    if (!removeModal.member) return;
    setIsRemoving(true);
    const result = await removeTeamMember(team.id, removeModal.member.user.id);
    if (result.success) {
      await refreshTeam();
      setRemoveModal({ open: false, member: null });
      showToast("success", "Member removed successfully");
    } else {
      showToast("error", result.error || "Failed to remove member");
    }
    setIsRemoving(false);
  };

  const handleOpenPermissions = (member) => {
    const defaultCat = { view: true, create: false, edit: false, delete: false, review: false, approve: false };
    const perms = member.permissions || {
      tasks: { ...defaultCat },
      milestones: { ...defaultCat },
      planningSteps: { ...defaultCat },
    };
    // Ensure planningSteps exists even on legacy records
    if (!perms.planningSteps) perms.planningSteps = { ...defaultCat };
    setPermissionsModal({ open: true, member, permissions: perms });
  };

  const handlePermToggle = (category, perm) => {
    setPermissionsModal((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: {
          ...prev.permissions[category],
          [perm]: !prev.permissions[category]?.[perm],
        },
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!permissionsModal.member) return;
    setIsSavingPerms(true);
    const result = await updateTeamMemberPermissions(
      team.id,
      permissionsModal.member.user.id,
      permissionsModal.permissions
    );
    if (result.success) {
      await refreshTeam();
      setPermissionsModal({ open: false, member: null, permissions: {} });
      showToast("success", "Permissions updated");
    } else {
      showToast("error", result.error || "Failed to update permissions");
    }
    setIsSavingPerms(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Team Details"
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Teams", href: "/owner/teams" },
          { label: team.name },
        ]}
        actions={
          <Link
            href={`/owner/teams/${team.id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit Team
          </Link>
        }
      />

      {/* Profile Header */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-violet-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTRWMjhIMjR2Mmgxem0tMTIgMHYtMkgxMnYyaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>
        <div className="px-8 pb-8 -mt-12 relative">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl font-bold">
              {team.name?.[0]?.toUpperCase() || "T"}
            </div>
            <div className="flex-1 pt-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{team.name}</h2>
              </div>
              {team.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{team.description}</p>
              )}
              <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-slate-400" />
                  {members.length} Member{members.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-slate-400" />
                  {projectTeams.length} Project{projectTeams.length !== 1 ? "s" : ""}
                </div>
                {team.lead && (
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    {team.lead.firstName} {team.lead.lastName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-slate-600 dark:text-slate-400">Team Lead</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {team.lead ? `${team.lead.firstName} ${team.lead.lastName}` : "No Lead"}
          </span>
        </div>
        <div className="bg-[#5542F6] text-white rounded-[24px] p-6 shadow-xl shadow-indigo-500/20 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-indigo-200">Members</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-lg font-bold">{members.length}</span>
        </div>
        <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-slate-600 dark:text-slate-400">Projects</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20">
              <FolderKanban className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{projectTeams.length}</span>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Team Members</h3>
              <p className="text-xs text-slate-400">{members.length} member{members.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Add Member Search */}
        <div ref={addDropdownRef} className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setShowAddDropdown(true);
              }}
              onFocus={() => setShowAddDropdown(true)}
              placeholder="Search and add members by name, email, or role..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
            {isPending && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {showAddDropdown && (
            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
              {filteredAddUsers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400">
                  {memberSearch ? "No matching users found" : "All users have been added"}
                </div>
              ) : (
                filteredAddUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddMember(user.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user.firstName, user.lastName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email} · {user.role.replace(/_/g, " ")}</p>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Members List */}
        {members.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users2 className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-slate-700" />
            <p className="text-sm">No members in this team yet. Search above to add members.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.filter(m => m.userId == team.leadId).map((member) => {
              const u = member.user;
              const isLead = team.leadId === u?.id;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                      {u?.avatar ? (
                        <img src={u.avatar} alt={`${u.firstName} ${u.lastName}`} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(u?.firstName, u?.lastName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                        {u?.firstName} {u?.lastName}
                        {isLead && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u?.email}</p>
                    </div>
                    <Badge value={u?.role || "EMPLOYEE"} />
                  </div>

                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <button
                      onClick={() => handleOpenPermissions(member)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      title="Permissions"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRemoveModal({ open: true, member })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {members.filter(m => m.userId != team.leadId).map((member) => {
              const u = member.user;
              const isLead = team.leadId === u?.id;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                      {u?.avatar ? (
                        <img src={u.avatar} alt={`${u.firstName} ${u.lastName}`} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(u?.firstName, u?.lastName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                        {u?.firstName} {u?.lastName}
                        {isLead && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u?.email}</p>
                    </div>
                    <Badge value={u?.role || "EMPLOYEE"} />
                  </div>

                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <button
                      onClick={() => handleOpenPermissions(member)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      title="Permissions"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRemoveModal({ open: true, member })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Assigned Projects</h3>
            <p className="text-xs text-slate-400">{projectTeams.length} project{projectTeams.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {projectTeams.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-slate-700" />
            <p className="text-sm">This team hasn't been assigned to any projects yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projectTeams.map((pt) => (
              <Link
                key={pt.id}
                href={`/owner/projects/${pt.project?.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {pt.project?.name?.[0]?.toUpperCase() || "P"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 group-hover:text-indigo-600 transition-colors">
                      {pt.project?.name}
                    </p>
                  </div>
                  {pt.project?.status && <Badge value={pt.project.status} />}
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors ml-3" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {permissionsModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPermissionsModal({ open: false, member: null, permissions: {} })}>
          <div className="bg-white dark:bg-slate-950 rounded-[24px] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Permissions</h3>
                <p className="text-xs text-slate-400">
                  {permissionsModal.member?.user?.firstName} {permissionsModal.member?.user?.lastName}
                </p>
              </div>
            </div>

            <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 mb-6 font-medium">
              These permissions control what this member can do on project tasks, milestones, and planning steps.
            </p>

            {[
              { key: "tasks", label: "Tasks", icon: ListChecks },
              { key: "milestones", label: "Milestones", icon: Target },
              { key: "planningSteps", label: "Planning Steps", icon: Layers },
            ].map(({ key: category, label, icon: CatIcon }) => (
              <div key={category} className="mb-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
                  <CatIcon className="w-4 h-4" />
                  {label}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {["view", "create", "edit", "delete", "review", "approve", "comment"].map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={permissionsModal.permissions[category]?.[perm] || false}
                        onChange={() => handlePermToggle(category, perm)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 capitalize font-medium">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setPermissionsModal({ open: false, member: null, permissions: {} })}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] disabled:opacity-50 transition-all"
              >
                {isSavingPerms && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      <ConfirmModal
        isOpen={removeModal.open}
        onClose={() => setRemoveModal({ open: false, member: null })}
        onConfirm={handleRemoveMember}
        isPending={isRemoving}
        title="Remove Member"
        message={`Are you sure you want to remove ${removeModal.member?.user?.firstName} ${removeModal.member?.user?.lastName} from this team?`}
        confirmLabel="Remove Member"
        variant="danger"
      />
    </div>
  );
}
