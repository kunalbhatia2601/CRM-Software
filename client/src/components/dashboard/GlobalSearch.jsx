"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  User,
  Target,
  Handshake,
  Building2,
  FolderKanban,
  Users2,
  Briefcase,
  ArrowRight,
  Command,
} from "lucide-react";
import { globalSearch } from "@/actions/search.action";

const TABS = [
  { key: "all", label: "All" },
  { key: "users", label: "Users", icon: User },
  { key: "leads", label: "Leads", icon: Target },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "clients", label: "Clients", icon: Building2 },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "teams", label: "Teams", icon: Users2 },
  { key: "services", label: "Services", icon: Briefcase },
];

const CATEGORY_CONFIG = {
  users: {
    icon: User,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    getName: (item) => `${item.firstName} ${item.lastName}`,
    getSub: (item) => item.email,
    getHref: (item) => `/owner/users/${item.id}`,
    badge: (item) => item.role?.replace("_", " "),
  },
  leads: {
    icon: Target,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    getName: (item) => item.companyName || item.contactName,
    getSub: (item) => item.contactName,
    getHref: (item) => `/owner/leads/${item.id}`,
    badge: (item) => item.status,
  },
  deals: {
    icon: Handshake,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    getName: (item) => item.title,
    getSub: (item) => item.stage?.replace("_", " "),
    getHref: (item) => `/owner/deals/${item.id}`,
    badge: (item) => item.stage?.replace("_", " "),
  },
  clients: {
    icon: Building2,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    getName: (item) => item.companyName || item.contactName,
    getSub: (item) => item.contactName,
    getHref: (item) => `/owner/clients/${item.id}`,
    badge: (item) => item.status,
  },
  projects: {
    icon: FolderKanban,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    getName: (item) => item.name,
    getSub: () => null,
    getHref: (item) => `/owner/projects/${item.id}`,
    badge: (item) => item.status?.replace("_", " "),
  },
  teams: {
    icon: Users2,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    getName: (item) => item.name,
    getSub: (item) =>
      item._count?.members
        ? `${item._count.members} member${item._count.members !== 1 ? "s" : ""}`
        : null,
    getHref: (item) => `/owner/teams/${item.id}`,
    badge: () => null,
  },
  services: {
    icon: Briefcase,
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-500/10",
    getName: (item) => item.name,
    getSub: () => null,
    getHref: (item) => `/owner/services/${item.id}`,
    badge: (item) => item.status,
  },
};

export default function GlobalSearch({ rolePrefix = "/owner" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Override category hrefs with rolePrefix
  const getHref = useCallback(
    (category, item) => {
      const basePath = CATEGORY_CONFIG[category]?.getHref(item) || "#";
      // Replace /owner with the actual role prefix
      return basePath.replace("/owner", rolePrefix);
    },
    [rolePrefix]
  );

  // Debounced search
  const doSearch = useCallback(async (val) => {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const res = await globalSearch(trimmed);
    setLoading(false);

    if (res.success && res.data) {
      setResults(res.data);
    } else {
      setResults(null);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (!open) setOpen(true);
    setActiveTab("all");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleItemClick = (category, item) => {
    const href = getHref(category, item);
    handleClear();
    router.push(href);
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Filtered results for current tab
  const visibleCategories = useMemo(() => {
    if (!results) return [];

    if (activeTab === "all") {
      return Object.keys(CATEGORY_CONFIG).filter(
        (key) => results[key]?.length > 0
      );
    }

    return results[activeTab]?.length > 0 ? [activeTab] : [];
  }, [results, activeTab]);

  const totalCount = results?.counts?.total || 0;

  const showDropdown = open && (query.length >= 2 || loading);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div
        className={`relative flex items-center w-full h-12 rounded-full bg-white dark:bg-slate-950 border px-4 shadow-sm dark:shadow-none transition-all shadow-slate-200/50 ${
          open
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-slate-200 dark:border-slate-700"
        }`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
        ) : (
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.length >= 2) setOpen(true);
          }}
          placeholder="Search everything..."
          className="w-full bg-transparent border-none outline-none px-3 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
        />
        {query ? (
          <button
            onClick={handleClear}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 rounded-md px-1.5 py-0.5 shrink-0">
            <Command className="w-3 h-3" />K
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden z-100 max-h-[480px] flex flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-0.5 px-3 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const count =
                tab.key === "all"
                  ? totalCount
                  : results?.counts?.[tab.key] || 0;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-[#5542F6] text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                  {results && (
                    <span
                      className={`text-[10px] min-w-[16px] text-center rounded-full px-1 ${
                        activeTab === tab.key
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Results Body */}
          <div className="overflow-y-auto flex-1 py-2">
            {loading && !results ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : visibleCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Search className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No results found</p>
                <p className="text-xs mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              visibleCategories.map((category) => {
                const config = CATEGORY_CONFIG[category];
                const Icon = config.icon;
                const items = results[category] || [];

                return (
                  <div key={category} className="mb-1">
                    {/* Category Header */}
                    {activeTab === "all" && (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center ${config.bg}`}
                        >
                          <Icon className={`w-3 h-3 ${config.color}`} />
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {category}
                        </span>
                        <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                      </div>
                    )}

                    {/* Items */}
                    {items.map((item) => {
                      const name = config.getName(item);
                      const sub = config.getSub(item);
                      const badge = config.badge(item);

                      return (
                        <button
                          key={`${category}-${item.id}`}
                          onClick={() => handleItemClick(category, item)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group text-left"
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}
                          >
                            <Icon
                              className={`w-4 h-4 ${config.color}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {name}
                            </p>
                            {sub && sub !== name && (
                              <p className="text-xs text-slate-400 truncate">
                                {sub}
                              </p>
                            )}
                          </div>

                          {badge && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                              {badge}
                            </span>
                          )}

                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-[11px] text-slate-400">
                {totalCount} result{totalCount !== 1 ? "s" : ""} found
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="bg-slate-200 dark:bg-slate-700 rounded px-1.5 py-0.5 font-mono">
                  esc
                </span>
                to close
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
