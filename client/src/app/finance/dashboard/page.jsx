import { getFinanceDashboardStats } from "@/actions/dashboard.action";
import FinanceDashboardContent from "./FinanceDashboardContent";

export default async function FinanceDashboard() {
  const stats = await getFinanceDashboardStats();
  return <FinanceDashboardContent stats={stats} />;
}
