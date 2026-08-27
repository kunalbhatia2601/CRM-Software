"use client";

import CampaignAnalytics from "@/components/campaigns/CampaignAnalytics";
import ExpenseTiles from "@/components/expenses/ExpenseTiles";

export default function MarketingDashboardContent() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Marketing</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Campaign performance across every project, and what it produced.
        </p>
      </div>

      <CampaignAnalytics />

      <ExpenseTiles basePath="/marketing" />
    </div>
  );
}
