import { getDeal } from "@/actions/deals.action";
import { getIsAIEnabled } from "@/actions/settings.action";
import ProposalContent from "./ProposalContent";

export default async function ProposalPage({ params }) {
  const { id } = await params;
  const [dealResult, settingsResult] = await Promise.all([
    getDeal(id),
    getIsAIEnabled(),
  ]);

  if (!dealResult.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Deal not found.</p>
      </div>
    );
  }

  const isAiConfigured = settingsResult?.isAiConfigured || false;

  return (
    <ProposalContent
      initialDeal={dealResult.data}
      isAiConfigured={isAiConfigured}
    />
  );
}
