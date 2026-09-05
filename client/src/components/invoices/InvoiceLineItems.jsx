"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

/** A fresh, empty line item. Every row carries a uid so React keys stay stable. */
export function blankItem() {
  return { uid: crypto.randomUUID(), name: "", description: "", quantity: 1, unitPrice: 0 };
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Move one entry of an array to a new index. */
function reorder(list, from, to) {
  if (from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * The invoice's line items, reorderable by dragging the grip.
 *
 * The server writes `position` from the array index, so the order shown here is
 * the order that lands on the invoice — no separate save step.
 *
 * Rows are keyed by a stable uid rather than the index; keying by index would
 * make React reuse the wrong input while a row is being dragged past another.
 *
 * @param {object[]} items
 * @param {(items: object[]) => void} onChange
 * @param {string} symbol currency symbol
 * @param {string} inputClass shared input styling from the parent form
 */
export default function InvoiceLineItems({ items, onChange, symbol, inputClass }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const update = (idx, field, value) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const add = () =>
    onChange([...items, blankItem()]);

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  function handleDrop(target) {
    if (dragIndex !== null) onChange(reorder(items, dragIndex, target));
    setDragIndex(null);
    setOverIndex(null);
  }

  /** Keyboard equivalent of a drag, so the grip is not mouse-only. */
  function handleGripKey(e, idx) {
    const to = e.key === "ArrowUp" ? idx - 1 : e.key === "ArrowDown" ? idx + 1 : null;
    if (to === null || to < 0 || to >= items.length) return;
    e.preventDefault();
    onChange(reorder(items, idx, to));
  }

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Line Items</h3>
        <button
          onClick={add}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
        >
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Drag the handle to reorder — this is the order the client sees on the invoice.
      </p>

      <div className="space-y-3">
        {items.map((it, idx) => (
          <div
            key={it.uid ?? idx}
            onDragOver={(e) => {
              // Without preventDefault the browser refuses the drop outright.
              e.preventDefault();
              setOverIndex(idx);
            }}
            onDrop={() => handleDrop(idx)}
            className={`flex gap-2 items-start rounded-lg transition-colors ${
              dragIndex === idx ? "opacity-40" : ""
            } ${overIndex === idx && dragIndex !== null && dragIndex !== idx
                ? "ring-2 ring-[#5542F6]/40 ring-offset-2 ring-offset-white dark:ring-offset-slate-950"
                : ""
            }`}
          >
            <button
              draggable
              onDragStart={(e) => {
                setDragIndex(idx);
                e.dataTransfer.effectAllowed = "move";
                // Firefox ignores a drag that carries no payload.
                e.dataTransfer.setData("text/plain", String(idx));
              }}
              onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
              onKeyDown={(e) => handleGripKey(e, idx)}
              title="Drag to reorder, or use the arrow keys"
              aria-label={`Reorder item ${idx + 1}`}
              className="mt-2 p-1 rounded text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0 focus:outline-none focus:ring-2 focus:ring-[#5542F6]/40"
            >
              <GripVertical className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-12 gap-2 items-start flex-1 min-w-0">
              <div className="col-span-5">
                <input
                  className={inputClass}
                  placeholder="Service / item name"
                  value={it.name}
                  onChange={(e) => update(idx, "name", e.target.value)}
                />
                <input
                  className={`${inputClass} mt-1.5 text-xs`}
                  placeholder="Description (optional)"
                  value={it.description}
                  onChange={(e) => update(idx, "description", e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number" min="0" step="0.01"
                  className={`${inputClass} text-right`}
                  placeholder="Qty"
                  value={it.quantity}
                  onChange={(e) => update(idx, "quantity", e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">{symbol}</span>
                  <input
                    type="number" min="0" step="0.01"
                    className={`${inputClass} text-right pl-6`}
                    placeholder="Unit price"
                    value={it.unitPrice}
                    onChange={(e) => update(idx, "unitPrice", e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-1 text-right text-sm font-medium text-slate-700 dark:text-slate-300 pt-2">
                {round2((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
              </div>
              <div className="col-span-1 flex justify-end pt-1.5">
                <button
                  onClick={() => remove(idx)}
                  className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
