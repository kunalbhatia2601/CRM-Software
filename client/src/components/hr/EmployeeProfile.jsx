"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, Briefcase, UserCircle, Shield,
  Fingerprint, CalendarClock, LayoutGrid, CalendarDays, FileText,
} from "lucide-react";
import { getUserReport } from "@/actions/users.action";
import AttendanceReport from "./AttendanceReport";
import EmployeeDocuments from "./EmployeeDocuments";

const ROLE_LABELS = {
  OWNER: "Owner", ADMIN: "Admin", SALES_MANAGER: "Sales Manager",
  ACCOUNT_MANAGER: "Account Manager", FINANCE_MANAGER: "Finance Manager",
  HR: "HR", EMPLOYEE: "Employee", CLIENT: "Client",
};
const EMP_TYPE_LABELS = {
  FULL_TIME: "Full-time", PART_TIME: "Part-time", INTERN: "Intern",
  FREELANCER: "Freelancer", CONTRACT: "Contract", OTHER: "Other",
};

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "attendance", label: "Attendance", icon: CalendarDays },
  { id: "documents", label: "Documents", icon: FileText },
];

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-slate-800 dark:text-slate-200 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function EmployeeProfile({ basePath = "/hr", userId, canManageDocs = true }) {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    (async () => {
      const res = await getUserReport(userId);
      if (res.success) setReport(res.data);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }
  if (!report?.user) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Employee not found.</p>
        <button onClick={() => router.push(`${basePath}/employees`)} className="mt-3 text-sm text-indigo-600">← Back to directory</button>
      </div>
    );
  }

  const u = report.user;
  const fullName = `${u.firstName} ${u.lastName}`;
  const initials = `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
  const manager = u.reportingManager;

  return (
    <div className="p-6 max-w-5xl">
      <button onClick={() => router.push(`${basePath}/employees`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Directory
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex items-center gap-4">
          {u.avatar ? (
            <img src={u.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-xl font-bold">{initials}</div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{fullName}</h1>
            <p className="text-sm text-slate-400">{ROLE_LABELS[u.role] || u.role}{u.employeeType ? ` · ${EMP_TYPE_LABELS[u.employeeType] || u.employeeType}` : ""}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.status}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800 w-fit mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        {tab === "overview" && (
          <div className="grid sm:grid-cols-2 gap-x-8">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact</p>
              <InfoRow icon={Mail} label="Email" value={u.email} />
              <InfoRow icon={Phone} label="Phone" value={u.phone} />
              <InfoRow icon={Phone} label="Emergency Contact" value={u.emergencyContactNumber} />
              <InfoRow icon={MapPin} label="Address" value={u.address} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Employment</p>
              <InfoRow icon={Shield} label="Role" value={ROLE_LABELS[u.role] || u.role} />
              <InfoRow icon={Briefcase} label="Employee Type" value={u.employeeType ? (EMP_TYPE_LABELS[u.employeeType] || u.employeeType) + (u.employeeTypeOther ? ` (${u.employeeTypeOther})` : "") : null} />
              <InfoRow icon={UserCircle} label="Reporting Manager" value={manager ? `${manager.firstName} ${manager.lastName}` : null} />
              <InfoRow icon={Fingerprint} label="Biometric Code" value={u.biometricCode != null ? String(u.biometricCode) : null} />
              <InfoRow icon={CalendarClock} label="Joined" value={u.createdAt ? new Date(u.createdAt).toLocaleDateString() : null} />
            </div>
          </div>
        )}
        {tab === "attendance" && <AttendanceReport userId={userId} userName={fullName} />}
        {tab === "documents" && <EmployeeDocuments userId={userId} canManage={canManageDocs} />}
      </div>
    </div>
  );
}
