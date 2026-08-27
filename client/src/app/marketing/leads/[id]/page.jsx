import { getLead } from "@/actions/leads.action";
import { getMeetingsByLead } from "@/actions/meetings.action";
import { getFollowUpsByLead } from "@/actions/followups.action";
import { getSamplesByLead } from "@/actions/samples.action";
import LeadDetailContent from "./LeadDetailContent";

export default async function LeadDetailPage({ params }) {
  const { id } = await params;
  const [result, meetingsResult, followUpsResult, samplesResult] = await Promise.all([
    getLead(id),
    getMeetingsByLead(id),
    getFollowUpsByLead(id),
    getSamplesByLead(id),
  ]);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Lead not found.</p>
      </div>
    );
  }

  return (
    <LeadDetailContent
      initialLead={result.data}
      initialMeetings={meetingsResult.data || []}
      initialFollowUps={followUpsResult.data || []}
      initialSamples={samplesResult.data || []}
    />
  );
}
