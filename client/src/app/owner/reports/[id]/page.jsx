import { notFound } from "next/navigation";
import { getReport } from "@/actions/reports.action";
import ReportView from "@/components/reports/ReportView";

export const metadata = { title: "Report" };

export default async function OwnerReportPage({ params }) {
  const { id } = await params;
  const res = await getReport(id);
  if (!res.success) notFound();

  return <ReportView initial={res.data} basePath="/owner" />;
}
