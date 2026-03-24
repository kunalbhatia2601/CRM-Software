import { getUserReport } from "@/actions/users.action";
import UserReportContent from "./UserReportContent";

export default async function ViewUserPage({ params }) {
  const { id } = await params;
  const result = await getUserReport(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">User not found or report unavailable.</p>
      </div>
    );
  }

  return <UserReportContent report={result.data} />;
}
