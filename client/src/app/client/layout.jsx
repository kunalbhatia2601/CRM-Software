import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Client Portal — ${name}` };
}

const navItems = [
  { name: "Dashboard", href: "/client/dashboard", icon: "LayoutDashboard" },
  { name: "Projects", href: "/client/projects", icon: "FolderKanban" },
  { name: "Meetings", href: "/client/meetings", icon: "Calendar" },
  { name: "Invoices", href: "/client/invoices", icon: "Receipt" },
];

export default async function ClientLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["CLIENT"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell title="Client Portal" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
