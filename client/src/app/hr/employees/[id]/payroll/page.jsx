import PayrollHistory from "@/components/hr/PayrollHistory";
export default async function HrEmployeePayrollPage({ params }) {
  const { id } = await params;
  return <PayrollHistory basePath="/hr" userId={id} />;
}
