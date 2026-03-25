import { getCampaign } from "@/actions/campaigns.action";
import { redirect } from "next/navigation";
import CampaignDetailContent from "./CampaignDetailContent";

export default async function CampaignDetailPage({ params }) {
  const { id } = await params;
  const result = await getCampaign(id);

  if (!result.success) {
    redirect("/owner/campaigns");
  }

  return <CampaignDetailContent initialCampaign={result.data} />;
}
