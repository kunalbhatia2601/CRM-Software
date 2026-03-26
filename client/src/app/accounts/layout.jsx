import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Accounts Panel — ${name}` };
}

export default async function AccountsLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>
    </AuthProvider>
  );
}
