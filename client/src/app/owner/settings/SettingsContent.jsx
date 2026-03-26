"use client";

import { useState } from "react";
import { BotIcon, Coins, Database, Globe, LayoutTemplateIcon, Mail, Server } from "lucide-react";
import SiteSettingsTab from "./SiteSettingsTab";
import SmtpSettingsTab from "./SmtpSettingsTab";
import EmailTemplatesTab from "./EmailTemplatesTab";

const TABS = [
  { id: "site", label: "Site Settings", icon: Globe },
  { id: "smtp", label: "Email Settings", icon: Mail },
  { id: "email-templates", label: "Email Templates", icon: LayoutTemplateIcon },
  { id: "storage", label: "Storage Settings", icon: Database },
  { id: "payment", label: "Payment Settings", icon: Coins },
  { id: "ai", label: "AI Settings", icon: BotIcon },
];

export default function SettingsContent({ initialSite, initialSettings }) {
  const [activeTab, setActiveTab] = useState("site");

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your site configuration, currency, and system preferences.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-950 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === "site" && <SiteSettingsTab initialData={initialSite} />}
        {activeTab === "smtp" && (
          <SmtpSettingsTab initialData={initialSettings} />
        )}
        {activeTab === "email-templates" && <EmailTemplatesTab />}
      </div>
    </div>
  );
}
