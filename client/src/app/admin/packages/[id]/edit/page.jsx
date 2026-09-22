import { getPackage } from "@/actions/packages.action";
import EditPackageContent from "./EditPackageContent";

export default async function OwnerEditPackagePage({ params }) {
  const { id } = await params;
  const result = await getPackage(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Package not found.</p>
      </div>
    );
  }

  return <EditPackageContent pkg={result.data} />;
}
