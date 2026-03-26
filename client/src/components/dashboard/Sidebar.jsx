"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSite } from "@/context/SiteContext";
import { useAuth } from "@/context/AuthContext";
import {
  PieChart,
  ClipboardList,
  LayoutGrid,
  Users,
  Presentation,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Command,
  Circle,
  X,
} from "lucide-react";

import * as LucideIcons from "lucide-react";

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

/**
 * Recursive NavItem Component
 */
function NavItem({ item, isActive, pathname, isCollapsed, level = 0, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = pathname === item.href || (hasChildren && pathname.startsWith(item.href || "---"));

  // Base padding left based on nest level
  let pl = "px-3";
  if (level === 1) pl = "pl-10 pr-3";
  else if (level === 2) pl = "pl-10 pr-3";
  else if (level >= 3) pl = "pl-16 pr-3";

  const Icon = typeof item.icon === "string" ? LucideIcons[item.icon] : (item.icon || LucideIcons.Circle);

  // Toggle submenu or navigate
  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (onNavigate) {
      // Close mobile sidebar on actual navigation
      onNavigate();
    }
  };

  return (
    <div className="flex flex-col w-full">
      <Link
        href={item.href || "#"}
        onClick={handleClick}
        style={{
          marginLeft: level == 0 ? "1rem" : level == 1 ? "2rem" : level == 2 ? "3rem" : "4rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
        }}
        className={`flex border-b border-slate-100 dark:border-slate-800 items-center justify-between py-3 rounded-2xl transition-colors group ${isItemActive && level === 0
            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
            : isItemActive && level > 0
              ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20/50"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
      >
        <div className="flex items-center gap-3 w-full">
          <div className={`flex items-center justify-center shrink-0 ${isCollapsed ? "mx-auto" : ""}`}>
            <Icon className={`w-5 h-5 ${isItemActive && level === 0
                ? "text-white"
                : isItemActive && level > 0
                  ? "text-indigo-600"
                  : "text-slate-400 group-hover:text-slate-600"
              }`} />
          </div>
          {!isCollapsed && (
            <span className={`font-medium whitespace-nowrap truncate ${isItemActive && level === 0 ? "text-white" : ""}`}>
              {item.name}
            </span>
          )}
        </div>

        {/* Dropdown Arrow */}
        {!isCollapsed && hasChildren && (
          <div className="shrink-0 pl-2">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} ${isItemActive && level === 0 ? "text-white/70" : "text-slate-400"}`} />
          </div>
        )}
      </Link>

      {/* Render Children Recursively */}
      {hasChildren && isOpen && !isCollapsed && (
        <div className="flex flex-col w-full mt-1 relative">
          {/* Vertical Guide Line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-slate-200 pointer-events-none"
            style={{ left: level === 0 ? '22px' : level === 1 ? '58px' : '74px' }}
          />
          {item.children.map((child, idx) => (
            <NavItem
              key={`${child.name}-${idx}`}
              item={child}
              pathname={pathname}
              isCollapsed={isCollapsed}
              level={level + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isCollapsed, toggleCollapse, navItems, isMobile, onNavigate }) {
  const pathname = usePathname();
  const site = useSite();
  const { logout, user } = useAuth();

  return (
    <aside
      className={`relative flex flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out h-full ${isMobile ? "w-64 shadow-2xl" : isCollapsed ? "w-20" : "w-64"
        } z-20`}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-transparent">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          {site?.logo ? (
            <img src={site.logo} alt={site.name} className="h-8 max-w-[120px] object-contain" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <Command className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-50 tracking-tight whitespace-nowrap">
                {site?.name?.split(" ")[0] || "TaskGo"}
              </span>
            </>
          )}
        </div>

        {/* Toggle / Close Button */}
        {
          isMobile &&
          <button
            onClick={toggleCollapse}
            className={`flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 ${isCollapsed && !isMobile ? 'mx-auto' : ''}`}
          >
            {isMobile ? (
              <X className="w-4 h-4" />
            ) : isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        }
      </div>

      {/* Navigation */}
      <nav className="flex-1 pr-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item, idx) => (
          <NavItem
            key={`${item.name}-${idx}`}
            item={item}
            pathname={pathname}
            isCollapsed={isCollapsed && !isMobile}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Profile & Logout */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-4 shrink-0 flex flex-col gap-2">
        {/* User Profile Block — Clickable link to profile page */}
        <Link
          href={`${ROLE_PREFIX_MAP[user?.role] || "/owner"}/profile`}
          onClick={onNavigate}
          className={`flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group ${isCollapsed && !isMobile ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
            {user?.avatar ? (
              <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-indigo-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>

          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {user?.email}
              </span>
            </div>
          )}
        </Link>

        {/* Logout Button */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors group ${isCollapsed && !isMobile ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-red-500" />
          {(!isCollapsed || isMobile) && <span className="font-medium whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
