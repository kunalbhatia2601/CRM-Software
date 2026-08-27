import CampaignsContent from "@/components/campaigns/CampaignsContent";

export const metadata = { title: "Campaigns" };

export default function AdminCampaignsPage() {
  return <CampaignsContent basePath="/admin" />;
}
