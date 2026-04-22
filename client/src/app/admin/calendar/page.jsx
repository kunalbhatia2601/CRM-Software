import { getCalendarEventsAction } from "@/actions/calendar.action";
import CalendarContent from "./CalendarContent";

export default async function AdminCalendarPage() {
  const result = await getCalendarEventsAction();
  const initialEvents = result?.success ? result.data || [] : [];
  return <CalendarContent initialEvents={initialEvents} />;
}
