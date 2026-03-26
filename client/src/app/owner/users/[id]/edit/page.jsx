import { getUser } from "@/actions/users.action";
import EditUserContent from "./EditUserContent";

export default async function EditUserPage({ params }) {
  const { id } = await params;
  const result = await getUser(id);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">User not found.</p>
      </div>
    );
  }

  return <EditUserContent user={result.data} />;
}
