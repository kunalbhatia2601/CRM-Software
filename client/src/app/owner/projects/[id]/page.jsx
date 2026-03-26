import { getProject } from "@/actions/projects.action";
import ProjectDetailContent from "./ProjectDetailContent";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const result = await getProject(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Project not found.</p>
      </div>
    );
  }

  return <ProjectDetailContent initialProject={result.data} />;
}
