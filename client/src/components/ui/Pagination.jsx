"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Page controls for any paged list — a table's rows or a stack of cards.
 *
 * Renders nothing when there is only one page, so it can be dropped in
 * unconditionally.
 *
 * @param {{page:number,totalPages:number,total:number,limit:number}} pagination
 * @param {(page: number) => void} onPageChange
 */
export default function Pagination({ pagination, onPageChange, className = "" }) {
  const { page = 1, totalPages = 1, total = 0, limit = 10 } = pagination || {};
  if (totalPages <= 1) return null;

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // A sliding window of five, clamped at both ends.
  const windowSize = Math.min(totalPages, 5);
  const start =
    totalPages <= 5 || page <= 3
      ? 1
      : page >= totalPages - 2
        ? totalPages - 4
        : page - 2;

  return (
    <div
      className={`flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 ${className}`}
    >
      <p className="text-xs text-slate-400">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange?.(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: windowSize }, (_, i) => start + i).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange?.(pageNum)}
            aria-current={pageNum === page ? "page" : undefined}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors ${
              pageNum === page
                ? "bg-[#5542F6] text-white shadow-sm dark:shadow-none"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange?.(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
