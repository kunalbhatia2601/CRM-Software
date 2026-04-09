import { getService } from "@/actions/services.action";
import ServiceDetailContent from "./ServiceDetailContent";

export default async function ServiceDetailPage({ params }) {
  const { id } = await params;
  const result = await getService(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Service not found.</p>
      </div>
    );
  }

  return <ServiceDetailContent initialService={result.data} />;
}
