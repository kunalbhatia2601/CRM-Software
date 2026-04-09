import { getMeetings } from "@/actions/meetings.action";
import SalesMeetingsContent from "./SalesMeetingsContent";

export default async function SalesMeetingsPage() {
  const result = await getMeetings({ page: 1, limit: 50, sortBy: "scheduledAt", sortOrder: "desc" });

  return <SalesMeetingsContent initialData={result.success ? result.data : { meetings: [], pagination: {} }} />;
}
