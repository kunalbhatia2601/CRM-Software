import { getClients } from "@/actions/clients.action";
import ClientsListContent from "./ClientsListContent";

export default async function OwnerClientsPage() {
  const result = await getClients({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { clients: [], pagination: {} };

  return <ClientsListContent initialData={initialData} />;
}
