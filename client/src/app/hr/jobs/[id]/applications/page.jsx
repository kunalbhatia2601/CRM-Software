import JobApplications from "@/components/hr/JobApplications";
export default async function HrJobApplicationsPage({ params }) {
  const { id } = await params;
  return <JobApplications basePath="/hr" jobId={id} />;
}
