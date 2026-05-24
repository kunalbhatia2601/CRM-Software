"use client";

import { Sparkles } from "lucide-react";

export function SuggestionChips({ suggestions, onSuggestionClick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick(suggestion)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full text-xs transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          {suggestion}
        </button>
      ))}
    </div>
  );
}