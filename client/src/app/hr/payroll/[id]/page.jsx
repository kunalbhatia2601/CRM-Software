import PayslipDetail from "@/components/hr/PayslipDetail";
export default async function HrPayslipPage({ params }) {
  const { id } = await params;
  return <PayslipDetail basePath="/hr" recordId={id} />;
}
