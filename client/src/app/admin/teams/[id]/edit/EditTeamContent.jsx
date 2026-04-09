"use client";

import { useState, useEffect, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users2, Search, Crown, X } from "lucide-react";
import { updateTeam, getTeamMembers } from "@/actions/teams.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsButton from "@/components/settings/SettingsButton";

export default function EditTeamContent({ initialTeam }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: initialTeam.name || "",
    description: initialTeam.description || "",
    leadId: initialTeam.leadId || "",
  });

  const [availableUsers, setAvailableUsers] = useState([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const leadDropdownRef = useRef(null);

  useEffect(() => {
    getTeamMembers().then((result) => {
      if (result.success) setAvailableUsers(result.data || []);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(e.target)) {
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

  const selectedLead = availableUsers.find((u) => u.id === form.leadId);

  const filteredLeadUsers = useMemo(() => {
    return availableUsers.filter((u) => {
      if (!leadSearch) return true;
      const q = leadSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [availableUsers, leadSearch]);

  const getInitials = (firstName, lastName) =>
    `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast("error", "Team name is required");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        leadId: form.leadId || null,
      };

      const result = await updateTeam(initialTeam.id, payload);
      if (result.success) {
        showToast("success", "Team updated successfully");
        setTimeout(() => router.push(`/admin/teams/${initialTeam.id}`), 1000);
      } else {
        showToast("error", result.error || "Failed to update team");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title={`Edit — ${initialTeam.name}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Teams", href: "/admin/teams" },
          { label: initialTeam.name, href: `/admin/teams/${initialTeam.id}` },
          { label: "Edit" },
        ]}
      />

      {/* Team Info */}
      <SettingsCard title="Team Details" description="Update the team name and description.">
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
              placeholder="Brief description of the team..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none resize-none"
            />
          </div>
        </div>
      </SettingsCard>

      {/* Team Lead */}
      <SettingsCard title="Team Lead" description="Designate a team leader (label only).">
        <div ref={leadDropdownRef} className="relative">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 block">
            Team Lead
          </label>

          {selectedLead ? (
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {selectedLead.avatar ? (
                    <img src={selectedLead.avatar} alt={selectedLead.name} className="w-full h-full object-cover rounded-full" />
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
                onClick={() => update("leadId", "")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => {
                    setLeadSearch(e.target.value);
                    setShowLeadDropdown(true);
                  }}
                  onFocus={() => setShowLeadDropdown(true)}
                  placeholder="Search for a team lead..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
                />
              </div>

              {showLeadDropdown && (
                <div className="z-50 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                  {filteredLeadUsers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">No users found</div>
                  ) : (
                    filteredLeadUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          update("leadId", user.id);
                          setLeadSearch("");
                          setShowLeadDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
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
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
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
          onClick={handleSave}
          label="Save Changes"
        />
      </div>
    </div>
  );
}
