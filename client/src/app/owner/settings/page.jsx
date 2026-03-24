import { getSiteSettings, getSystemSettings } from "@/actions/settings.action";
import SettingsContent from "./SettingsContent";

export default async function OwnerSettingsPage() {
  const [siteData, settingsData] = await Promise.all([
    getSiteSettings(),
    getSystemSettings(),
  ]);

  return <SettingsContent initialSite={siteData} initialSettings={settingsData} />;
}
