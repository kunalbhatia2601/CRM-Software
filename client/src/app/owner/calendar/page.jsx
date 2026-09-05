import { getCalendarEventsAction } from "@/actions/calendar.action";
import CalendarContent from "@/components/calendar/CalendarContent";

export default async function OwnerCalendarPage() {
  const result = await getCalendarEventsAction();
  const initialEvents = result?.success ? result.data || [] : [];
  return <CalendarContent initialEvents={initialEvents} />;
}
