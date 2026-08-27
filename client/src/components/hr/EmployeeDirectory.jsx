"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Loader2, Mail, ChevronRight } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getUserDirectory } from "@/actions/users.action";

const ROLE_LABELS = {
  OWNER: "Owner", ADMIN: "Admin", SALES_MANAGER: "Sales Manager",
  ACCOUNT_MANAGER: "Account Manager", FINANCE_MANAGER: "Finance Manager",
  MARKETING_MANAGER: "Marketing Manager",
  HR: "HR", EMPLOYEE: "Employee",
};

const ROLE_STYLES = {
  OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ADMIN: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  MARKETING_MANAGER: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  HR: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  EMPLOYEE: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function EmployeeDirectory({ basePath = "/hr" }) {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    (async () => {
      const res = await getUserDirectory();
      if (res.success) setUsers(res.data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      const matchQ = !q || name.includes(q) || u.email?.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchQ && matchRole;
    });
  }, [users, search, roleFilter]);

  const roles = useMemo(() => [...new Set(users.map((u) => u.role))], [users]);

  const initials = (u) => `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="p-6">
      <PageHeader title="Employee Directory" description={`${users.length} active team members`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 outline-none"
        >
          <option value="">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No employees found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => router.push(`${basePath}/employees/${u.id}`)}
              className="group flex items-center gap-3 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#5542F6] hover:shadow-sm transition-all text-left"
            >
              {u.avatar ? (
                <img src={u.avatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-semibold shrink-0">
                  {initials(u)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${ROLE_STYLES[u.role] || ROLE_STYLES.EMPLOYEE}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#5542F6] shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
