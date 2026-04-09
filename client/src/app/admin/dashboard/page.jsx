import { getDashboardStats } from "@/actions/dashboard.action";
import DashboardContent from "./DashboardContent";

export default async function OwnerDashboard() {
  const stats = await getDashboardStats();

  return <DashboardContent stats={stats} />;
}
