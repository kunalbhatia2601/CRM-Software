import React from "react";
import { ChevronDown } from "lucide-react";

export default function SettingsSelect({
  label,
  icon: Icon,
  value,
  onChange,
  className = "",
  options = [],
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label className="text-sm font-semibold text-slate-800">{label}</label>}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 flex justify-center items-center pointer-events-none z-10">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <select
          value={value}
          onChange={onChange}
          className={`w-full ${Icon ? "pl-11" : "pl-4"} pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50/80 text-[15px] font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none shadow-sm cursor-pointer relative z-0`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 flex justify-center items-center pointer-events-none z-10">
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
