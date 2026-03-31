"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Loader2,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Target,
  Handshake,
  Building2,
  FolderKanban,
  Users2,
  Briefcase,
  User,
  Settings,
} from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/actions/notifications.action";

const TYPE_CONFIG = {
  INFO: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  SUCCESS: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  WARNING: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ERROR: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  LEAD: { icon: Target, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
  DEAL: { icon: Handshake, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  CLIENT: { icon: Building2, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-500/10" },
  PROJECT: { icon: FolderKanban, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
  TEAM: { icon: Users2, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
  SERVICE: { icon: Briefcase, color: "text-teal-500", bg: "bg-teal-50 dark:bg-teal-500/10" },
  USER: { icon: User, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
  SYSTEM: { icon: Settings, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-500/10" },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const containerRef = useRef(null);
  const pollingRef = useRef(null);

  // Fetch unread count (for badge)
  const fetchUnreadCount = useCallback(async () => {
    const res = await getUnreadCount();
    if (res.success) {
      setUnreadCount(res.data?.unreadCount || 0);
    }
  }, []);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await getNotifications({ page: 1, limit: 20 });
    setLoading(false);
    if (res.success && res.data) {
      setNotifications(res.data.notifications || []);
      setPagination(res.data.pagination);
      setUnreadCount(res.data.unreadCount ?? 0);
    }
  }, []);

  // Poll unread count every 10s
  useEffect(() => {
    fetchUnreadCount();
    pollingRef.current = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(pollingRef.current);
  }, [fetchUnreadCount]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

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

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    setActionLoading(id);
    const res = await markNotificationRead(id);
    setActionLoading(null);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading("all");
    const res = await markAllNotificationsRead();
    setActionLoading(null);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setActionLoading(`del-${id}`);
    const res = await deleteNotification(id);
    setActionLoading(null);
    if (res.success) {
      const removed = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const handleItemClick = (notification) => {
    // Mark as read
    if (!notification.isRead) {
      markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // Navigate if there's a link
    if (notification.linkUrl) {
      setOpen(false);
      router.push(notification.linkUrl);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bell wiggle + badge pulse keyframes */}
      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-12deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(4deg); }
          60% { transform: rotate(0deg); }
        }
        .bell-wiggle { animation: bell-ring 1.5s ease-in-out infinite; transform-origin: top center; }
        @keyframes badge-pop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .badge-enter { animation: badge-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Bell Button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
          open
            ? "bg-[#5542F6]/10 dark:bg-[#5542F6]/20 border-[#5542F6]/40 text-[#5542F6] ring-2 ring-[#5542F6]/20 border"
            : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-slate-200/50 dark:shadow-none"
        }`}
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 && !open ? "bell-wiggle" : ""}`} />

        {/* Ping ring */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 pointer-events-none">
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
          </span>
        )}
        
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{zIndex : 1000}} className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden z-100 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={actionLoading === "all"}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  {actionLoading === "all" ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  Read all
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[calc(100vh-300px)] flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.INFO;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleItemClick(notification)}
                    className={`flex gap-3 px-5 py-3.5 transition-colors group ${
                      notification.linkUrl ? "cursor-pointer" : "cursor-default"
                    } ${
                      notification.isRead
                        ? "hover:bg-slate-50 dark:hover:bg-slate-900/30"
                        : "bg-indigo-50/40 dark:bg-indigo-500/5 hover:bg-indigo-50/70 dark:hover:bg-indigo-500/10"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug truncate ${
                            notification.isRead
                              ? "text-slate-600 dark:text-slate-400 font-medium"
                              : "text-slate-900 dark:text-slate-50 font-semibold"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-[#5542F6] shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {timeAgo(notification.createdAt)}
                        </span>
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkRead(e, notification.id)}
                              disabled={actionLoading === notification.id}
                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors"
                              title="Mark as read"
                            >
                              {actionLoading === notification.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          )}
                          {/* <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            disabled={actionLoading === `del-${notification.id}`}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            {actionLoading === `del-${notification.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                            ) : (
                              <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                            )}
                          </button> */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}
    </div>
  );
}
