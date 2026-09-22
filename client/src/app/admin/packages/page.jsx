import { getPackages } from "@/actions/packages.action";
import PackagesListContent from "./PackagesListContent";

export default async function OwnerPackagesPage() {
  const result = await getPackages({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { packages: [], pagination: {} };
  return <PackagesListContent initialData={initialData} />;
}
