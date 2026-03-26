import { getClient } from "@/actions/clients.action";
import EditClientContent from "./EditClientContent";

export default async function EditClientPage({ params }) {
  const { id } = await params;
  const result = await getClient(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Client not found.</p>
      </div>
    );
  }

  return <EditClientContent client={result.data} />;
}
