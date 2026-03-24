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
  Circle
} from "lucide-react";

import * as LucideIcons from "lucide-react";

/**
 * Recursive NavItem Component
 */
function NavItem({ item, isActive, pathname, isCollapsed, level = 0 }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = pathname === item.href || (hasChildren && pathname.startsWith(item.href || "---"));
  
  // Base padding left based on nest level
  const pl = level === 0 ? "px-3" : `pl-${4 + level * 4} pr-3`;
  const Icon = typeof item.icon === "string" ? LucideIcons[item.icon] : (item.icon || LucideIcons.Circle);

  // Toggle submenu
  const toggleOpen = (e) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <Link
        href={item.href || "#"}
        onClick={toggleOpen}
        className={`flex items-center justify-between py-3 rounded-2xl transition-colors group ${pl} ${
          isItemActive && level === 0
            ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
            : isItemActive && level > 0
            ? "text-indigo-600 bg-indigo-50/50"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3 w-full">
          <div className={`flex items-center justify-center shrink-0 ${isCollapsed ? "mx-auto" : ""}`}>
            <Icon className={`w-5 h-5 ${
              isItemActive && level === 0 
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
        <div className="flex flex-col w-full mt-1 relative before:absolute before:left-[21px] before:top-0 before:bottom-0 before:w-px before:bg-slate-100">
          {item.children.map((child, idx) => (
            <NavItem 
              key={`${child.name}-${idx}`} 
              item={child} 
              pathname={pathname} 
              isCollapsed={isCollapsed} 
              level={level + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isCollapsed, toggleCollapse, navItems }) {
  const pathname = usePathname();
  const site = useSite();
  const { logout, user } = useAuth();

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-transparent">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          {site?.logo ? (
            <img src={site.logo} alt={site.name} className="h-8 max-w-[120px] object-contain" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <Command className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight whitespace-nowrap">
                {site?.name?.split(" ")[0] || "TaskGo"}
              </span>
            </>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={`flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 ${isCollapsed ? 'mx-auto' : ''}`}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item, idx) => (
          <NavItem 
            key={`${item.name}-${idx}`} 
            item={item} 
            pathname={pathname} 
            isCollapsed={isCollapsed} 
          />
        ))}
      </nav>

      {/* Profile & Logout */}
      <div className="border-t border-slate-100 p-4 shrink-0 flex flex-col gap-2">
        {/* User Profile Block */}
        <div className={`flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors group ${isCollapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
            {user?.avatar ? (
              <img src={user.avatar} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-indigo-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            )}
          </div>
          
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-medium text-sm text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {user?.email}
              </span>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors group ${isCollapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-red-500" />
          {!isCollapsed && <span className="font-medium whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
