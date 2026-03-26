import { getServices } from "@/actions/services.action";
import ServicesListContent from "./ServicesListContent";

export default async function OwnerServicesPage() {
  const result = await getServices({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { services: [], pagination: {} };
  return <ServicesListContent initialData={initialData} />;
}
