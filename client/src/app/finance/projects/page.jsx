import { getProjects } from "@/actions/projects.action";
import ProjectsListContent from "./ProjectsListContent";

export default async function OwnerProjectsPage() {
  const result = await getProjects({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { projects: [], pagination: {} };
  return <ProjectsListContent initialData={initialData} />;
}
