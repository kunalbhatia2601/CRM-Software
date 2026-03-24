import { getUsers } from "@/actions/users.action";
import UsersListContent from "./UsersListContent";

export default async function OwnerUsersPage() {
  const result = await getUsers({ page: 1, limit: 10 });
  const initialData = result.success ? result.data : { users: [], pagination: {} };

  return <UsersListContent initialData={initialData} />;
}
