import { getSample } from "@/actions/samples.action";
import SampleDetailContent from "./SampleDetailContent";

export default async function SampleDetailPage({ params }) {
  const { id } = await params;
  const result = await getSample(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Sample not found.</p>
      </div>
    );
  }

  return <SampleDetailContent initialSample={result.data} />;
}
