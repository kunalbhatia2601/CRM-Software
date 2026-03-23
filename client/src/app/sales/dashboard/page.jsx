"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { TrendingUp, Briefcase, Users, DollarSign } from "lucide-react";

const stats = [
  { label: "Total Leads", value: "—", icon: Users, color: "bg-blue-50 text-blue-600" },
  { label: "Open Deals", value: "—", icon: Briefcase, color: "bg-amber-50 text-amber-600" },
  { label: "Deal Value", value: "—", icon: DollarSign, color: "bg-green-50 text-green-600" },
  { label: "Conversion Rate", value: "—", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
];

export default function SalesDashboard() {
  return (
    <DashboardShell title="Sales Dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500">Dashboard modules will be built in upcoming phases.</p>
      </div>
    </DashboardShell>
  );
}
