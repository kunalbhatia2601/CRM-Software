import CampaignsContent from "@/components/campaigns/CampaignsContent";

export const metadata = { title: "Campaigns" };

export default function OwnerCampaignsPage() {
  return <CampaignsContent basePath="/owner" />;
}
