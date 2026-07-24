import EmployeeProfile from "@/components/hr/EmployeeProfile";
export default async function HrEmployeeProfilePage({ params }) {
  const { id } = await params;
  return <EmployeeProfile basePath="/hr" userId={id} canManageDocs />;
}
