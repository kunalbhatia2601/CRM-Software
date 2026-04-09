import { getSamples } from "@/actions/samples.action";
import SamplesListContent from "./SamplesListContent";

export default async function OwnerSamplesPage() {
  const result = await getSamples({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { samples: [], pagination: {} };
  return <SamplesListContent initialData={initialData} />;
}
