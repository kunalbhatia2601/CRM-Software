import React from "react";

const VARIANTS = {
  // User roles
  OWNER: "bg-purple-50 text-purple-700 border-purple-200",
  ADMIN: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 border-indigo-200",
  SALES_MANAGER: "bg-blue-50 text-blue-700 border-blue-200",
  ACCOUNT_MANAGER: "bg-cyan-50 text-cyan-700 border-cyan-200",
  FINANCE_MANAGER: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200",
  HR: "bg-pink-50 text-pink-700 border-pink-200",
  EMPLOYEE: "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  CLIENT: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200",

  // User status
  ACTIVE: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  SUSPENDED: "bg-red-50 text-red-600 border-red-200",
  INVITED: "bg-blue-50 text-blue-600 border-blue-200",

  // Lead status
  NEW: "bg-blue-50 text-blue-600 border-blue-200",
  CONTACTED: "bg-sky-50 text-sky-600 border-sky-200",
  QUALIFIED: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200",
  UNQUALIFIED: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200",
  CONVERTED: "bg-green-50 text-green-600 border-green-200",
  LOST: "bg-red-50 text-red-600 border-red-200",

  // Deal stages
  DISCOVERY: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200",
  PROPOSAL: "bg-blue-50 text-blue-600 border-blue-200",
  NEGOTIATION: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200",
  WON: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200",

  // Project status
  NOT_STARTED: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  IN_PROGRESS: "bg-blue-50 text-blue-600 border-blue-200",
  ON_HOLD: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200",
  COMPLETED: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",

  // Client status
  CHURNED: "bg-red-50 text-red-600 border-red-200",

  // Priorities
  LOW: "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  MEDIUM: "bg-blue-50 text-blue-600 border-blue-200",
  HIGH: "bg-orange-50 text-orange-600 border-orange-200",
  URGENT: "bg-red-50 text-red-600 border-red-200",

  // Billing Cycles
  ONE_TIME: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  MONTHLY: "bg-violet-50 text-violet-600 border-violet-200",
  QUARTERLY: "bg-blue-50 text-blue-600 border-blue-200",
  SEMI_ANNUAL: "bg-cyan-50 text-cyan-600 border-cyan-200",
  ANNUAL: "bg-teal-50 text-teal-600 border-teal-200",

  // Generic
  default: "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

const LABELS = {
  SALES_MANAGER: "Sales Manager",
  ACCOUNT_MANAGER: "Account Manager",
  FINANCE_MANAGER: "Finance Manager",
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  ONE_TIME: "One Time",
  SEMI_ANNUAL: "Semi Annual",
  EMAIL_CAMPAIGN: "Email Campaign",
  SOCIAL_MEDIA: "Social Media",
  COLD_CALL: "Cold Call",
};

export default function Badge({ value, className = "" }) {
  const variant = VARIANTS[value] || VARIANTS.default;
  const label = LABELS[value] || (value || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${variant} ${className}`}
    >
      {label}
    </span>
  );
}
