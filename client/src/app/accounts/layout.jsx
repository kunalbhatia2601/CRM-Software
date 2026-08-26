import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Accounts Panel — ${name}`, robots: { index: false, follow: false } };
}

const navItems = [
  { name: "Dashboard", href: "/accounts/dashboard", icon: "LayoutDashboard" },
  {
    name: "Clients",
    href: "/accounts/clients",
    icon: "Building2",
  },
  {
    name: "Projects",
    href: "/accounts/projects",
    icon: "FolderKanban",
    children: [
      { name: "All Projects", href: "/accounts/projects" },
      { name: "Add Project", href: "/accounts/projects/create" },
    ],
  },
  { name: "Invoices", href: "/accounts/invoices", icon: "ReceiptText" },
  { name: "My Expenses", href: "/accounts/expenses", icon: "Receipt" },
  { name: "Documents", href: "/accounts/documents", icon: "FileText" },
  { name: "Meetings", href: "/accounts/meetings", icon: "Calendar" },
  { name: "Teams", href: "/accounts/teams", icon: "Users" },
  { name: "My Attendance", href: "/accounts/my-attendance", icon: "Clock" },
  { name: "Apply Leave", href: "/accounts/my-leaves", icon: "FileText" },
];

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
      <DashboardShell title="Accounts Panel" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
