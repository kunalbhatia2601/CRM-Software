import { getLead } from "@/actions/leads.action";
import LeadDetailContent from "./LeadDetailContent";

export default async function LeadDetailPage({ params }) {
  const { id } = await params;
  const result = await getLead(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Lead not found.</p>
      </div>
    );
  }

  return <LeadDetailContent initialLead={result.data} />;
}
