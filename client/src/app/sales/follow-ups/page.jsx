import { getFollowUps } from "@/actions/followups.action";
import SalesFollowUpsContent from "./SalesFollowUpsContent";

export default async function SalesFollowUpsPage() {
  const result = await getFollowUps({ page: 1, limit: 50, sortBy: "dueAt", sortOrder: "asc" });

  return <SalesFollowUpsContent initialData={result.success ? result.data : { followUps: [], pagination: {} }} />;
}
