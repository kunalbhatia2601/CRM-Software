import PayrollRun from "@/components/hr/PayrollRun";

// Read-only: finance disburses salaries but never generates or edits a run.
export default function FinancePayrollPage() {
  return <PayrollRun basePath="/finance" canManage={false} />;
}
