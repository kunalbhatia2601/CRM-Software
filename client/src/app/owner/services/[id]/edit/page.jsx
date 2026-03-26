import { getService } from "@/actions/services.action";
import EditServiceContent from "./EditServiceContent";

export default async function EditServicePage({ params }) {
  const { id } = await params;
  const result = await getService(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Service not found.</p>
      </div>
    );
  }

  return <EditServiceContent service={result.data} />;
}
