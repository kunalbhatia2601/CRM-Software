import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `HR Panel — ${name}`, robots: { index: false, follow: false } };
}

const navItems = [
  { name: "Dashboard", href: "/hr/dashboard", icon: "LayoutDashboard" },
  { name: "Employees", href: "/hr/employees", icon: "UsersRound" },
  { name: "Attendance", href: "/hr/attendance", icon: "Clock" },
  {
    name: "Leave",
    href: "/hr/leave-requests",
    icon: "FileText",
    children: [
      { name: "Requests", href: "/hr/leave-requests" },
      { name: "Calendar", href: "/hr/leave-calendar" },
      { name: "Types", href: "/hr/leave-types" },
      { name: "Balances", href: "/hr/leave-balances" },
    ],
  },
  { name: "Holidays", href: "/hr/holidays", icon: "Calendar" },
  { name: "Payroll", href: "/hr/payroll", icon: "Wallet" },
  { name: "Announcements", href: "/hr/announcements", icon: "Megaphone" },
  { name: "Jobs", href: "/hr/jobs", icon: "Briefcase" },
  {
    name: "Teams",
    href: "/hr/teams",
    icon: "Users",
    children: [
      { name: "All Teams", href: "/hr/teams" },
      { name: "Add Team", href: "/hr/teams/create" },
    ],
  },
];

export default async function HrLayout({ children }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!["OWNER", "ADMIN", "HR"].includes(user.role)) redirect("/login");

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell title="HR Panel" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
