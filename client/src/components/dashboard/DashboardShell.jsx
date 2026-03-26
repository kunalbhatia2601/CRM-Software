"use client";

import { useState, useCallback, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ThemeProvider } from "../providers/ThemeProvider";

export default function DashboardShell({ title, children, navItems }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    mq.addEventListener("change", (e) => setIsMobile(e.matches));
  }, []);

  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((p) => !p), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden">

        {/* ── Dark Overlay (mobile only, shown when drawer is open) ── */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        {/* ── Mobile Sidebar Drawer (hidden on lg+) ────────────── */}
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <Sidebar
            isCollapsed={false}
            toggleCollapse={closeMobileSidebar}
            navItems={navItems}
            isMobile={isMobile}
            onNavigate={closeMobileSidebar}
          />
        </div>

        {/* ── Desktop Sidebar (hidden below lg) ────────────────── */}
        <div className="hidden lg:block">
          <Sidebar
            isCollapsed={isCollapsed}
            toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            navItems={navItems}
            isMobile={false}
          />
        </div>

        {/* ── Main Content Area ──────────────────────────────────── */}
        <div className="flex flex-col flex-1 w-full h-screen overflow-hidden">
          <Header onMenuClick={toggleMobileSidebar} isMobile={isMobile} />

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
