"use client";

import { useState, useEffect, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users2,
  UserCheck,
  Plus,
  X,
  Search,
  Crown,
  Loader2,
} from "lucide-react";
import { createTeam, getTeamMembers } from "@/actions/teams.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

export default function CreateTeamContent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    leadId: "",
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const memberSearchRef = useRef(null);
  const leadSearchRef = useRef(null);
  const memberDropdownRef = useRef(null);
  const leadDropdownRef = useRef(null);

  useEffect(() => {
    getTeamMembers().then((result) => {
      if (result.success) {
        setAvailableUsers(result.data || []);
      }
    });
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(e.target)
      ) {
        setShowMemberDropdown(false);
      }
      if (
        leadDropdownRef.current &&
        !leadDropdownRef.current.contains(e.target)
      ) {
        setShowLeadDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter users for member search (exclude already selected + CLIENT)
  const filteredMemberUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      if (selectedMembers.some((m) => m.id === u.id)) return false;
      if (!memberSearch) return true;
      const q = memberSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().replace(/_/g, " ").includes(q)
      );
    });
  }, [availableUsers, selectedMembers, memberSearch]);

  // Filter users for lead search
  const filteredLeadUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      if (!leadSearch) return true;
      const q = leadSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [availableUsers, leadSearch]);

  const selectedLead = availableUsers.find((u) => u.id === form.leadId);

  const handleSelectMember = (user) => {
    setSelectedMembers((prev) => [...prev, user]);
    setMemberSearch("");
    setShowMemberDropdown(false);
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSelectLead = (user) => {
    update("leadId", user.id);
    setLeadSearch("");
    setShowLeadDropdown(false);
  };

  const handleClearLead = () => {
    update("leadId", "");
    setLeadSearch("");
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      showToast("error", "Team name is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.leadId) payload.leadId = form.leadId;
      if (selectedMembers.length > 0) {
        payload.memberIds = selectedMembers.map((m) => m.id);
      }

      const result = await createTeam(payload);
      if (result.success) {
        router.push(`/admin/teams/${result.data.id}`);
      } else {
        showToast("error", result.error || "Failed to create team");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="New Team"
        description="Create a new team and add members."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Teams", href: "/admin/teams" },
          { label: "New Team" },
        ]}
      />

      {/* Team Info */}
      <SettingsCard title="Team Info" description="Basic team details.">
        <div className="grid grid-cols-1 gap-6">
          <SettingsInput
            label="Team Name *"
            icon={Users2}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Design Team"
          />
          <div>
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the team's focus and responsibilities..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
            />
          </div>
        </div>
      </SettingsCard>

      {/* Team Lead */}
      <SettingsCard
        title="Team Lead"
        description="Designate a team leader (label only)."
      >
        <div ref={leadDropdownRef} className="relative">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
            Team Lead
          </label>

          {/* Selected Lead Display */}
          {selectedLead ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {selectedLead.avatar ? (
                    <img
                      src={selectedLead.avatar}
                      alt={selectedLead.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    getInitials(selectedLead.firstName, selectedLead.lastName)
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                    {selectedLead.name}
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  </p>
                  <p className="text-xs text-slate-400">{selectedLead.email}</p>
                </div>
              </div>
              <button
                onClick={handleClearLead}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={leadSearchRef}
                  type="text"
                  value={leadSearch}
                  onChange={(e) => {
                    setLeadSearch(e.target.value);
                    setShowLeadDropdown(true);
                  }}
                  onFocus={() => setShowLeadDropdown(true)}
                  placeholder="Search for a team lead by name or email..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
                />
              </div>

              {/* Dropdown */}
              {showLeadDropdown && (
                <div className="z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                  {filteredLeadUsers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">
                      No users found
                    </div>
                  ) : (
                    filteredLeadUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectLead(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(user.firstName, user.lastName)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {user.email} · {user.role.replace(/_/g, " ")}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SettingsCard>

      {/* Team Members */}
      <SettingsCard
        title="Team Members"
        description="Add members to this team. Search by name or email."
      >
        {/* Search Input */}
        <div ref={memberDropdownRef} className="relative mb-6">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
            Add Members
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={memberSearchRef}
              type="text"
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setShowMemberDropdown(true);
              }}
              onFocus={() => setShowMemberDropdown(true)}
              placeholder="Search users by name, email, or role..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
            />
          </div>

          {/* Dropdown */}
          {showMemberDropdown && (
            <div className=" z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
              {filteredMemberUsers.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400">
                  {memberSearch
                    ? "No matching users found"
                    : "All users have been added"}
                </div>
              ) : (
                filteredMemberUsers.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectMember(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(user.firstName, user.lastName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email} · {user.role.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Members Count */}
        {selectedMembers.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setSelectedMembers([])}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              Remove all
            </button>
          </div>
        )}

        {/* Members List */}
        {selectedMembers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No members added yet. Search above to find and add team members.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(member.firstName, member.lastName)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
                      {member.name}
                      {form.leadId === member.id && (
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {member.email} · {member.role.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      {/* Submit */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <SettingsButton
          isPending={isPending}
          onClick={handleSubmit}
          label="Create Team"
        />
      </div>
    </div>
  );
}
