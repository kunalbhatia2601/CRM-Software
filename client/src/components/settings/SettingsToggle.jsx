import React from "react";

export default function SettingsToggle({
  label,
  description,
  icon: Icon,
  iconColorClass = "text-slate-600",
  iconBgClass = "bg-slate-50",
  activeColorClass = "bg-indigo-500",
  isActive,
  onToggle,
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 rounded-[20px] border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all cursor-pointer group bg-white shadow-sm text-left"
    >
      <div className="flex items-start md:items-center gap-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBgClass} flex items-center justify-center shrink-0 border border-slate-200/50 group-hover:scale-105 transition-transform`}>
            <Icon className={`w-6 h-6 ${iconColorClass}`} />
          </div>
        )}
        <div className="flex flex-col">
          <p className="text-[15px] font-bold text-slate-900">{label}</p>
          <p className="text-[13px] text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div
        className={`relative w-14 h-8 rounded-full transition-colors shrink-0 border border-transparent shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] ${
          isActive ? activeColorClass : "bg-slate-200"
        }`}
      >
        <div
          className={`absolute top-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-md transition-transform ${
            isActive ? "translate-x-[28px]" : "translate-x-[3px]"
          }`}
        />
      </div>
    </button>
  );
}
