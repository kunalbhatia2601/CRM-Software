"use client";

import React from "react";
import { Check, AlertCircle, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium ${
        toast.type === "success"
          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border border-emerald-200 shadow-sm dark:shadow-none"
          : "bg-red-50 text-red-700 border border-red-200 shadow-sm dark:shadow-none"
      }`}
    >
      {toast.type === "success" ? (
        <Check className="w-4 h-4 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0" />
      )}
      <span className="flex-1">{toast.message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 hover:opacity-70 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
