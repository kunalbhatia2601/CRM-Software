import { getDeal } from "@/actions/deals.action";
import DealDetailContent from "./DealDetailContent";

export default async function DealDetailPage({ params }) {
  const { id } = await params;
  const result = await getDeal(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Deal not found.</p>
      </div>
    );
  }

  return <DealDetailContent initialDeal={result.data} />;
}
