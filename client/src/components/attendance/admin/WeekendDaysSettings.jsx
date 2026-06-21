"use client";

import { useState, useEffect } from "react";
import { Loader2, CalendarDays, Save } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { getSystemSettings, updateSystemSettings } from "@/actions/settings.action";

// 0 = Sunday … 6 = Saturday (matches Settings.weekendDays + JS getUTCDay)
const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

export default function WeekendDaysSettings() {
  const [selected, setSelected] = useState([0, 6]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      const settings = await getSystemSettings();
      if (settings && Array.isArray(settings.weekendDays)) {
        setSelected(settings.weekendDays);
      }
      setLoading(false);
    })();
  }, []);

  const toggle = (day) => {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateSystemSettings({ weekendDays: [...selected].sort((a, b) => a - b) });
    setSaving(false);
    setToast(
      res.success
        ? { type: "success", message: "Weekend days updated" }
        : { type: "error", message: res.error || "Failed to update" }
    );
  };

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4 text-[#5542F6]" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-50">Weekend Days</h3>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Days auto-marked as weekend during attendance reconciliation.
      </p>

      {loading ? (
        <div className="flex items-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {DAYS.map((d) => {
            const active = selected.includes(d.value);
            return (
              <button
                key={d.value}
                onClick={() => toggle(d.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  active
                    ? "bg-[#5542F6] text-white border-[#5542F6]"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-[#5542F6]"
                }`}
              >
                {d.label}
              </button>
            );
          })}

          <button
            onClick={handleSave}
            disabled={saving}
            className="ml-auto inline-flex items-center gap-2 px-4 py-1.5 bg-[#5542F6] text-white text-sm font-semibold rounded-lg hover:bg-[#4636d4] disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}
