"use client";

import Link from "next/link";
import { Megaphone, Wallet, Target, ArrowRight } from "lucide-react";
import ExpenseTiles from "@/components/expenses/ExpenseTiles";

// Campaign figures land here once the campaign module is built (step 2+).
const PLACEHOLDERS = [
  { icon: Megaphone, label: "Active campaigns", href: "/marketing/campaigns" },
  { icon: Wallet, label: "Ad budget available", href: "/marketing/ad-budget" },
  { icon: Target, label: "Leads this month", href: "/marketing/leads" },
];

export default function MarketingDashboardContent() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Marketing</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Campaigns, ad budget and the leads they produce.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLACEHOLDERS.map(({ icon: Icon, label, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">—</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
            <span className="text-xs text-[#5542F6] mt-2 inline-flex items-center gap-1">
              Open <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>

      <ExpenseTiles basePath="/marketing" />
    </div>
  );
}
