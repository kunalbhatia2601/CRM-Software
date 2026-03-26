"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { FolderKanban, AlertCircle, MessageSquare, TrendingUp } from "lucide-react";

const stats = [
  { label: "Active Projects", value: "—", icon: FolderKanban, color: "bg-blue-50 text-blue-600" },
  { label: "Outstanding Issues", value: "—", icon: AlertCircle, color: "bg-red-50 text-red-600" },
  { label: "Messages", value: "—", icon: MessageSquare, color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" },
  { label: "Progress Updates", value: "—", icon: TrendingUp, color: "bg-green-50 text-green-600" },
];

export default function ClientPortal() {
  return (
    <DashboardShell title="Client Portal">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400">Dashboard modules will be built in upcoming phases.</p>
      </div>
    </DashboardShell>
  );
}
