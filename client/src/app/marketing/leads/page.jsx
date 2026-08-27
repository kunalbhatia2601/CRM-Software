import { getLeads } from "@/actions/leads.action";
import LeadsListContent from "./LeadsListContent";

export default async function OwnerLeadsPage() {
  const result = await getLeads({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { leads: [], pagination: {} };

  return <LeadsListContent initialData={initialData} />;
}
