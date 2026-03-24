import React from "react";
import { Loader2, Save } from "lucide-react";

export default function SettingsButton({
  isPending,
  onClick,
  label = "Save Settings",
  disabled,
  className = "",
}) {
  return (
    <button
      onClick={onClick}
      disabled={isPending || disabled}
      className={`flex items-center gap-2 px-6 py-3 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      {isPending ? "Saving..." : label}
    </button>
  );
}
