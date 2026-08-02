"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Users, RefreshCw, Pencil, X } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import { getUserDirectory } from "@/actions/users.action";
import { getUserLeaveBalances, updateLeaveBalance, seedLeaveBalances } from "@/actions/leave.action";

export default function AdminLeaveBalancesManager() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  // Load user list once
  useEffect(() => {
    getUserDirectory().then((res) => {
      if (res.success) {
        setUsers(res.data);
        if (res.data.length > 0) setSelectedUser(res.data[0]);
      }
      setLoadingUsers(false);
    });
  }, []);

  const loadBalances = useCallback(async () => {
    if (!selectedUser) return;
    setLoadingBalances(true);
    const res = await getUserLeaveBalances(selectedUser.id, year);
    if (res.success) setBalances(res.data);
    setLoadingBalances(false);
  }, [selectedUser, year]);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || u.role.toLowerCase().includes(q);
  });

  const handleSaveBalance = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await updateLeaveBalance(editing.id, {
      allocated: Number(editing.allocated),
      used: Number(editing.used),
    });
    setSaving(false);
    if (res.success) {
      showToast("success", "Balance updated");
      setEditing(null);
      loadBalances();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    const res = await seedLeaveBalances(year);
    setSeeding(false);
    if (res.success) {
      showToast("success", `Seeded balances for ${res.data.seededForUsers} user${res.data.seededForUsers !== 1 ? "s" : ""}`);
      loadBalances();
    } else {
      showToast("error", res.error || "Failed");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Leave Balances</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and adjust each user&apos;s annual leave allocation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min="2000"
            max="2100"
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm w-24"
          />
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 disabled:opacity-50"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Seed {year} balances
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* User list */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
              />
            </div>
          </div>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No users match.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => {
                const selected = selectedUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${selected ? "bg-[#5542F6]/5" : "hover:bg-slate-50 dark:hover:bg-slate-900"}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5542F6] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">{u.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Balances */}
        <div className="lg:col-span-3">
          {!selectedUser ? (
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-400">Select a user to view their leave balance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#5542F6] text-white text-sm font-bold flex items-center justify-center">
                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <Badge value={selectedUser.role} /> · {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {loadingBalances ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : balances.length === 0 ? (
                <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-sm text-slate-400">
                  No balance data for {year}. Click &quot;Seed {year} balances&quot; to create default quotas.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {balances.map((b) => {
                    const isUnlimited = b.leaveType?.defaultQuota === null;
                    const remaining = isUnlimited ? null : (b.allocated || 0) - (b.used || 0);
                    return (
                      <div key={b.id} className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.leaveType?.color || "#94a3b8" }} />
                            <h4 className="font-semibold text-slate-900 dark:text-slate-50">{b.leaveType?.name}</h4>
                          </div>
                          <button
                            onClick={() => setEditing({ ...b })}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </div>
                        {isUnlimited ? (
                          <div>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">∞</p>
                            <p className="text-xs text-slate-400 mt-1">Unlimited · Used: {b.used}</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-[10px] uppercase text-slate-400 tracking-wide">Allocated</p>
                              <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{b.allocated}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400 tracking-wide">Used</p>
                              <p className="text-xl font-bold text-amber-600">{b.used}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase text-slate-400 tracking-wide">Remaining</p>
                              <p className="text-xl font-bold text-emerald-600">{remaining}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit balance modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-white dark:bg-slate-950 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Edit {editing.leaveType?.name} Balance</h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Allocated</label>
              <input
                type="number"
                value={editing.allocated}
                onChange={(e) => setEditing({ ...editing, allocated: e.target.value })}
                step="0.5"
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Used</label>
              <input
                type="number"
                value={editing.used}
                onChange={(e) => setEditing({ ...editing, used: e.target.value })}
                step="0.5"
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-[#5542F6] outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Used auto-increments on approved leaves; edit only for corrections.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBalance}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#5542F6] text-white text-sm font-semibold rounded-xl hover:bg-[#4636d4] disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
