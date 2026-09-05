"use client";

import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Eye, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import ThemeToggle from "@/components/ui/ThemeToggle";

const MOCK_DATE_FNS = false; // Use real date-fns, but if missing, fallback in thought

// Since we may not have date-fns installed, I'll write generic JS dates just to be safe.
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function generateCalendarGrid(currentDate) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = getDaysInMonth(year, month);

  const days = [];
  // Fill leading empty
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Fill days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  // Fill trailing to complete 7 col grid
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  return days;
}

/** Local YYYY-MM-DD key. Built from local parts so a date never shifts a day. */
function dateKeyOf(d) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Midnight events are system dates (a due date, a milestone), not appointments. */
function eventTime(date) {
  const t = new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return t === "12:00 am" || t === "12:00 AM" ? "All day" : t;
}

export default function CalendarContent({ initialEvents = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("calendar"); // calendar | list
  const [selectedEvent, setSelectedEvent] = useState(null);
  // The day the user drilled into. Null means no day panel is open.
  const [selectedDay, setSelectedDay] = useState(null);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Group events by date string (YYYY-MM-DD local)
  const eventsByDate = {};
  initialEvents.forEach(event => {
    if (!event.date) return;
    const dateKey = dateKeyOf(event.date);

    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  const getStatusColor = (type) => {
    switch (type) {
      case "Task": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200";
      case "Meeting": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200";
      case "Project Phase": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200";
      case "Planning Phase": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-200";
      case "Milestone": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200";
      case "Follow Up": return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const currentMonthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInGrid = generateCalendarGrid(currentDate);

  // Group events for List view
  const listDates = Object.keys(eventsByDate).sort((a,b) => new Date(a) - new Date(b));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Calendar" 
          description="View all tasks, meetings, milestones, and project dates."
        />
        
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700">
          <button 
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors ${view === "calendar" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Grid View</span>
          </button>
          <button 
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 text-sm font-medium transition-colors ${view === "list" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            <List className="w-4 h-4" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {view === "calendar" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{currentMonthName}</h2>
            <div className="flex items-center space-x-2">
              <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition"
              >
                Today
              </button>
              <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r last:border-r-0 border-gray-200 dark:border-gray-700">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
            {daysInGrid.map((day, i) => {
              if (!day) return <div key={i} className="border-b border-r last:border-r-0 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20" />;
              
              const isToday = new Date().toDateString() === day.toDateString();
              const dateKey = dateKeyOf(day);
              const dayEvents = eventsByDate[dateKey] || [];

              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDay(day)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedDay(day);
                    }
                  }}
                  title={`${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"} on ${day.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`}
                  className={`p-2 border-b border-r last:border-r-0 border-gray-100 dark:border-gray-700/50 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300'}`}>
                      {day.getDate()}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div 
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                        className={`text-xs truncate px-1.5 py-1 rounded border cursor-pointer hover:opacity-80 ${getStatusColor(event.type)}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-6">
          {listDates.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Events Found</h3>
              <p className="text-gray-500 dark:text-gray-400">There are no calendar events scheduled.</p>
            </div>
          ) : (
            listDates.map(dateStr => {
              const dString = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
              return (
                <div key={dateStr} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{dString}</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {eventsByDate[dateStr].map(event => (
                      <div key={event.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(event.type)}`}>
                            {event.type}
                          </div>
                          <div>
                            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">{event.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) !== '12:00 AM' 
                                ? new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'All Day System Event'
                              }
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedEvent(event)}
                          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* One day, in full */}
      {selectedDay && (() => {
        const dayEvents = eventsByDate[dateKeyOf(selectedDay)] || [];
        const shiftDay = (delta) => {
          const next = new Date(selectedDay);
          next.setDate(next.getDate() + delta);
          setSelectedDay(next);
          // Follow the day across a month boundary so the grid behind agrees.
          setCurrentDate(new Date(next.getFullYear(), next.getMonth(), 1));
        };

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => shiftDay(-1)} title="Previous day"
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button onClick={() => shiftDay(1)} title="Next day"
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button onClick={() => setSelectedDay(null)} title="Close"
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                {dayEvents.length === 0 ? (
                  <div className="p-12 text-center">
                    <CalendarIcon className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Nothing scheduled on this day.</p>
                  </div>
                ) : (
                  dayEvents.map((event) => (
                    <div key={event.id} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-0.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(event.type)}`}>
                          {event.type}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-medium text-gray-900 dark:text-white">{event.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span>{eventTime(event.date)}</span>
                            {event.status && <span className="capitalize">{event.status.replace(/_/g, " ").toLowerCase()}</span>}
                            {event.priority && <span className="capitalize">{event.priority.toLowerCase()} priority</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 shrink-0"
                      >
                        <Eye className="w-4 h-4" /> Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">{selectedEvent.title}</h3>
              <div className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEvent.type)}`}>
                {selectedEvent.type}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date & Time</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">
                  {new Date(selectedEvent.date).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">{selectedEvent.status?.replace(/_/g, ' ') || 'N/A'}</p>
              </div>
              
              {selectedEvent.priority && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium capitalize">{selectedEvent.priority.toLowerCase()}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
