import { getMeetings } from "@/actions/meetings.action";
import AccountMeetingsContent from "./AccountMeetingsContent";

export default async function AccountMeetingsPage() {
  const result = await getMeetings({ page: 1, limit: 50, sortBy: "scheduledAt", sortOrder: "desc" });

  return <AccountMeetingsContent initialData={result.success ? result.data : { meetings: [], pagination: {} }} />;
}
