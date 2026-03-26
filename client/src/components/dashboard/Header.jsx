"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Search, Bell, Settings, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const ROLE_PREFIX_MAP = {
  OWNER: "/owner",
  ADMIN: "/admin",
  SALES_MANAGER: "/sales",
  ACCOUNT_MANAGER: "/accounts",
  FINANCE_MANAGER: "/finance",
  HR: "/hr",
  EMPLOYEE: "/employee",
  CLIENT: "/client",
};

export default function Header({ isMobile, onMenuClick }) {
  const { user } = useAuth();

  // Get current date string like "Today, Mon 22 Nov"
  const getFormattedDate = () => {
    const today = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    const dateStr = today.toLocaleDateString('en-US', options);
    return `Today, ${dateStr}`;
  };

  return (
    <header className="h-20 lg:h-24 px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-[#F8FAFC] dark:bg-slate-950 gap-3">
      {/* Left: Hamburger (mobile) + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Hamburger — visible only on mobile / tablet */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm shadow-slate-200/50 dark:shadow-none shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search */}
        <div className="relative flex items-center w-full h-12 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-4 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 shadow-sm dark:shadow-none transition-all shadow-slate-200/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent border-none outline-none px-3 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Center Date (Hidden on mobile / tablet) */}
      <div className="hidden lg:flex flex-1 justify-center">
        <div className="text-sm font-medium text-indigo-600/80 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-1.5 rounded-full">
          {getFormattedDate()}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex justify-end items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <button className="relative w-10 h-10 rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm shadow-slate-200/50 dark:shadow-none">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="hidden sm:flex items-center gap-3 pl-2">
          <Link
            href={`${ROLE_PREFIX_MAP[user?.role] || "/owner"}/profile`}
            className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-indigo-500/20 transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
