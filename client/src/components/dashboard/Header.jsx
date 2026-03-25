"use client";

import { useAuth } from "@/context/AuthContext";
import { Search, Bell, Settings, Menu } from "lucide-react";

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
    <header className="h-20 lg:h-24 px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-[#F8FAFC] gap-3">
      {/* Left: Hamburger (mobile) + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {/* Hamburger — visible only on mobile / tablet */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm shadow-slate-200/50 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search */}
        <div className="relative flex items-center w-full h-12 rounded-full bg-white border border-slate-200 px-4 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 shadow-sm transition-all shadow-slate-200/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-transparent border-none outline-none px-3 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Center Date (Hidden on mobile / tablet) */}
      <div className="hidden lg:flex flex-1 justify-center">
        <div className="text-sm font-medium text-indigo-600/80 bg-indigo-50 px-4 py-1.5 rounded-full">
          {getFormattedDate()}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex justify-end items-center gap-2 sm:gap-4">
        <button className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm shadow-slate-200/50">
          <Settings className="w-5 h-5" />
        </button>
        <button className="relative w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm shadow-slate-200/50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        {/* User Profile */}
        <div className="hidden sm:flex items-center gap-3 pl-2">
          <button className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-200">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
