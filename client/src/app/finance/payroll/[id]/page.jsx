import PayslipDetail from "@/components/hr/PayslipDetail";

export default async function FinancePayslipPage({ params }) {
  const { id } = await params;
  return <PayslipDetail basePath="/finance" recordId={id} canManage={false} />;
}
