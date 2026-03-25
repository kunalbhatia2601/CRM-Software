import { getCampaigns, getCampaignOverview } from "@/actions/campaigns.action";
import CampaignsListContent from "./CampaignsListContent";

export default async function OwnerCampaignsPage() {
  const [campaignsResult, overviewResult] = await Promise.all([
    getCampaigns({ limit: 25, datePreset: "last_30d" }),
    getCampaignOverview("last_30d"),
  ]);

  const initialCampaigns = campaignsResult.success ? campaignsResult.data : { campaigns: [], paging: null };
  const initialOverview = overviewResult.success ? overviewResult.data : null;

  return (
    <CampaignsListContent
      initialCampaigns={initialCampaigns}
      initialOverview={initialOverview}
      error={!campaignsResult.success ? campaignsResult.error : null}
    />
  );
}
