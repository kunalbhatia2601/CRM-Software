import { getDeals } from "@/actions/deals.action";
import DealsListContent from "./DealsListContent";

export default async function OwnerDealsPage() {
  const result = await getDeals({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { deals: [], pagination: {} };

  return <DealsListContent initialData={initialData} />;
}
