import React from "react";

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = false,
  className = "",
}) {
  if (accent) {
    return (
      <div className={`bg-[#5542F6] rounded-[24px] p-6 text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-between min-h-[160px] ${className}`}>
        <div className="flex justify-between items-start">
          <span className="font-medium opacity-90 text-sm">{label}</span>
          {Icon && (
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-950/20 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
        <div>
          <span className="text-3xl font-bold">{value}</span>
          {subtext && <p className="text-xs text-indigo-200 mt-1">{subtext}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-950 rounded-[24px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none shadow-slate-200/50 dark:shadow-none flex flex-col justify-between min-h-[160px] ${className}`}>
      <div className="flex justify-between items-start">
        <span className="font-medium text-slate-600 dark:text-slate-400 text-sm">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{value}</span>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
