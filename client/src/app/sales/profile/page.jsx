import { getAuthUser } from "@/actions/auth.action";
import { redirect } from "next/navigation";
import ProfileContent from "@/components/profile/ProfileContent";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "My Profile" };

export default async function OwnerProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader
        title="My Profile"
        description="Manage your personal information and security settings."
        breadcrumbs={[
          { label: "Dashboard", href: "/sales/dashboard" },
          { label: "Profile" },
        ]}
      />
      <ProfileContent user={user} />
    </>
  );
}
