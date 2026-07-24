import JobEditor from "@/components/hr/JobEditor";
export default async function HrJobEditPage({ params }) {
  const { id } = await params;
  return <JobEditor basePath="/hr" jobId={id} />;
}
