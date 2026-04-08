import { getProject } from "@/actions/projects.action";
import { getMeetingsByProject } from "@/actions/meetings.action";
import { getDocumentsByProject } from "@/actions/documents.action";
import { getPlanningStepsByProject } from "@/actions/planning-steps.action";
import { getTasksByProject, getAssignableUsers } from "@/actions/tasks.action";
import { getMilestonesByProject } from "@/actions/milestones.action";
import ProjectDetailContent from "./ProjectDetailContent";

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const [result, meetingsResult, docsResult, stepsResult, tasksResult, milestonesResult, assignableResult] = await Promise.all([
    getProject(id),
    getMeetingsByProject(id),
    getDocumentsByProject(id),
    getPlanningStepsByProject(id),
    getTasksByProject(id),
    getMilestonesByProject(id),
    getAssignableUsers(id),
  ]);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Project not found.</p>
      </div>
    );
  }

  return (
    <ProjectDetailContent
      initialProject={result.data}
      initialMeetings={meetingsResult.data || []}
      initialDocuments={docsResult.data || []}
      initialSteps={stepsResult.data || []}
      initialTasks={tasksResult.data || []}
      initialMilestones={milestonesResult.data || []}
      assignableUsers={assignableResult.data || []}
    />
  );
}
