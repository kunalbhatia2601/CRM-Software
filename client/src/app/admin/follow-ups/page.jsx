import { getFollowUps } from "@/actions/followups.action";
import FollowUpsContent from "@/components/followups/FollowUpsContent";

export const metadata = { title: "Follow-ups" };

export default async function FollowUpsPage() {
  const result = await getFollowUps({ page: 1, limit: 20, sortBy: "dueAt", sortOrder: "asc" });

  return (
    <FollowUpsContent
      initialData={result.success ? result.data : { followUps: [], pagination: {} }}
      basePath="/admin"
    />
  );
}
