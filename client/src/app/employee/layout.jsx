import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Employee Panel — ${name}`, robots: { index: false, follow: false } };
}

const navItems = [
  { name: "Dashboard", href: "/employee/dashboard", icon: "LayoutDashboard" },
  { name: "My Tasks", href: "/employee/tasks", icon: "ListChecks" },
  { name: "Projects", href: "/employee/projects", icon: "FolderKanban" },
  { name: "Meetings", href: "/employee/meetings", icon: "Calendar" },
  { name: "My Attendance", href: "/employee/my-attendance", icon: "Clock" },
  { name: "Apply Leave", href: "/employee/my-leaves", icon: "FileText" },
];

export default async function EmployeeLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN", "EMPLOYEE"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell title="Employee Panel" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
