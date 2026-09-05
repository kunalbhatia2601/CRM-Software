"use client";

import { Plus, Trash2, RotateCcw } from "lucide-react";
import { fmtDate, fmtNum, fmtPct } from "./reportShape";

/* ── Primitives ─────────────────────────────────────────── */

export function Section({ title, subtitle, icon: Icon, right, children }) {
  return (
    <section className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden break-inside-avoid">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#5542F6] shrink-0" />} {title}
          </h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Tile({ label, value, sub, tone = "slate" }) {
  const tones = {
    slate: "text-slate-900 dark:text-slate-50",
    emerald: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    indigo: "text-indigo-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/30">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-xl font-bold mt-1 ${tones[tone]}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export function Empty({ children = "Nothing recorded for this month." }) {
  return <p className="text-sm text-slate-400 text-center py-6">{children}</p>;
}

/** Horizontal scroll lives on the table, never the page. */
export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {head.map((h) => (
              <th key={h} className="py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className = "" }) => (
  <td className={`py-2.5 pr-4 text-slate-700 dark:text-slate-200 whitespace-nowrap ${className}`}>
    {children}
  </td>
);

/* ── Editable grid ──────────────────────────────────────── */

const inputCls =
  "w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5542F6]/30";

/**
 * A hand-entered table. Columns describe the row shape; rows are edited in
 * place and handed back whole, which keeps the override a single JSON value.
 *
 * Declared at module scope on purpose — a component defined inside its parent
 * is a new type every render and would drop the caret on each keystroke.
 *
 * @param {{key:string,label:string,type?:string,width?:string}[]} columns
 */
export function EditableGrid({ columns, rows, onChange, editing, addLabel = "Add row" }) {
  function update(i, key, value) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r));
    onChange(next);
  }

  if (!editing) {
    if (rows.length === 0) return <Empty />;
    return (
      <Table head={columns.map((c) => c.label)}>
        {rows.map((row, i) => (
          <tr key={i}>
            {columns.map((c) => (
              <Td key={c.key} className={c.type === "number" ? "tabular-nums" : "whitespace-normal"}>
                {c.type === "number"
                  ? fmtNum(row[c.key])
                  : c.type === "percent"
                    ? fmtPct(row[c.key])
                    : c.type === "date"
                      ? fmtDate(row[c.key])
                      : row[c.key] || "—"}
              </Td>
            ))}
          </tr>
        ))}
      </Table>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-sm min-w-max">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              {columns.map((c) => (
                <th key={c.key} className="py-2 pr-3 font-medium whitespace-nowrap">{c.label}</th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key} className="py-1.5 pr-3" style={{ minWidth: c.width || "140px" }}>
                    <input
                      className={inputCls}
                      type={c.type === "number" || c.type === "percent" ? "number" : c.type === "date" ? "date" : "text"}
                      value={row[c.key] ?? ""}
                      onChange={(e) =>
                        update(
                          i,
                          c.key,
                          c.type === "number" || c.type === "percent"
                            ? e.target.value === "" ? null : Number(e.target.value)
                            : e.target.value
                        )
                      }
                    />
                  </td>
                ))}
                <td className="py-1.5">
                  <button
                    onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))])}
        className="text-xs text-[#5542F6] hover:underline flex items-center gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  );
}

/** Marks a section as hand-entered, with a one-click revert to the auto value. */
export function OverrideBadge({ on, onRevert }) {
  if (!on) return null;
  return (
    <button
      onClick={onRevert}
      className="text-[11px] px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 print:hidden"
      title="Revert to the auto-generated value"
    >
      <RotateCcw className="w-3 h-3" /> Manual
    </button>
  );
}
