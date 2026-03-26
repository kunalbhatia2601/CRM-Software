import React from "react";

export default function SettingsInput({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  className = "",
  rightElement,
  ...props
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 flex justify-center items-center pointer-events-none">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-11" : "pl-4"} ${
            rightElement ? "pr-12" : "pr-4"
          } py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
}
