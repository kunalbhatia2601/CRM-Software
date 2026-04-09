import { getTeams } from "@/actions/teams.action";
import TeamsListContent from "./TeamsListContent";

export default async function OwnerTeamsPage() {
  const result = await getTeams({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { teams: [], pagination: {} };
  return <TeamsListContent initialData={initialData} />;
}
