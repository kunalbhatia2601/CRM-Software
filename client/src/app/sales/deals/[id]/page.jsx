import { getDeal } from "@/actions/deals.action";
import { getMeetingsByDeal } from "@/actions/meetings.action";
import { getSamplesByDeal } from "@/actions/samples.action";
import DealDetailContent from "./DealDetailContent";

export default async function DealDetailPage({ params }) {
  const { id } = await params;
  const [result, meetingsResult, samplesResult] = await Promise.all([
    getDeal(id),
    getMeetingsByDeal(id),
    getSamplesByDeal(id),
  ]);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Deal not found.</p>
      </div>
    );
  }

  return (
    <DealDetailContent
      initialDeal={result.data}
      initialMeetings={meetingsResult.data || []}
      initialSamples={samplesResult.data || []}
    />
  );
}
