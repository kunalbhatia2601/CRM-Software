import { getSalesDashboardStats } from "@/actions/dashboard.action";
import SalesDashboardContent from "./SalesDashboardContent";

export default async function SalesDashboard() {
  const stats = await getSalesDashboardStats();

  return <SalesDashboardContent stats={stats} />;
}
