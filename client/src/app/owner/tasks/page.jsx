import { getMyTasks } from "@/actions/tasks.action";
import { getAssignableStaff } from "@/actions/users.action";
import OwnerTasksContent from "./OwnerTasksContent";

export default async function OwnerTasksPage() {
  // "Mine" is the default view — the owner's own tasks, same as everyone else
  // sees first. The staff list fills the "check someone else's" dropdown.
  const [result, staff] = await Promise.all([getMyTasks(), getAssignableStaff()]);

  return (
    <OwnerTasksContent
      initialTasks={result.success ? result.data : []}
      staff={staff}
    />
  );
}
