import { getTeam } from "@/actions/teams.action";
import TeamDetailContent from "./TeamDetailContent";

export default async function TeamDetailPage({ params }) {
  const { id } = await params;
  const result = await getTeam(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Team not found.</p>
      </div>
    );
  }

  return <TeamDetailContent initialTeam={result.data} />;
}
