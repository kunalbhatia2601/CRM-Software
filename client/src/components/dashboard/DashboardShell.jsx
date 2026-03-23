"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function DashboardShell({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="container mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">
              TaskGo
            </span>
            <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2.5 py-1 rounded-full">
              {user?.role?.replace("_", " ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
