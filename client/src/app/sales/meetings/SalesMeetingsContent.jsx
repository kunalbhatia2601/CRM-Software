"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Calendar, Search, Video, Phone, MapPin, Clock, Loader2 } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { getMeetings } from "@/actions/meetings.action";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
];

const modeIcons = { VIRTUAL: Video, PHONE_CALL: Phone, IN_PERSON: MapPin };

export default function SalesMeetingsContent({ initialData }) {
  const [meetings, setMeetings] = useState(initialData?.meetings || []);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50, sortBy: "scheduledAt", sortOrder: "desc" };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const result = await getMeetings(params);
      if (result.success) setMeetings(result.data.meetings || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchMeetings, 300);
    return () => clearTimeout(timer);
  }, [fetchMeetings]);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };
  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };
  const isUpcoming = (date) => new Date(date) > new Date();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Meetings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Client meetings, calls, and appointments.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meetings..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-[#5542F6] focus:border-transparent outline-none">
          {STATUS_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : meetings.length > 0 ? (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const ModeIcon = modeIcons[meeting.mode] || Video;
            const upcoming = isUpcoming(meeting.scheduledAt);
            return (
              <div key={meeting.id} className={`bg-white dark:bg-slate-950 rounded-2xl border p-5 ${upcoming ? "border-[#5542F6]/20" : "border-slate-200 dark:border-slate-800"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${upcoming ? "bg-[#5542F6]/10" : "bg-slate-100 dark:bg-slate-800"}`}>
                      <ModeIcon className={`w-5 h-5 ${upcoming ? "text-[#5542F6]" : "text-slate-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{meeting.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge value={meeting.status} />
                        <Badge value={meeting.mode} />
                        {meeting.lead && <Link href={`/sales/leads/${meeting.lead.id}`} className="text-xs text-[#5542F6] hover:underline">{meeting.lead.companyName}</Link>}
                        {meeting.deal && <Link href={`/sales/deals/${meeting.deal.id}`} className="text-xs text-[#5542F6] hover:underline">{meeting.deal.title}</Link>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{formatDate(meeting.scheduledAt)}</p>
                    <p className="text-sm text-slate-500">{formatTime(meeting.scheduledAt)}</p>
                    {meeting.duration && <p className="flex items-center gap-1 text-xs text-slate-400 mt-1 justify-end"><Clock className="w-3 h-3" /> {meeting.duration} min</p>}
                  </div>
                </div>
                {meeting.link && upcoming && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#5542F6] text-white text-sm font-medium rounded-xl hover:bg-[#4636d4] transition-colors">
                      <ModeIcon className="w-4 h-4" /> {meeting.mode === "VIRTUAL" ? "Join Meeting" : meeting.mode === "PHONE_CALL" ? "Call" : "Get Directions"}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">No meetings found.</p>
        </div>
      )}
    </div>
  );
}
