import React from "react";

export default function SettingsCard({ title, description, children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 relative overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="mb-8">
          {title && <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1.5">{title}</h2>}
          {description && <p className="text-[15px] text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
