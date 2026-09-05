import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { CopilotWrapper } from "@/components/copilot/CopilotWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Owner Panel — ${name}`, robots: { index: false, follow: false } };
}

const navItems = [
  { name: "Dashboard", href: "/owner/dashboard", icon: "LayoutDashboard" },
  { name: "Calendar", href: "/owner/calendar", icon: "Calendar" },
  { name: "Campaigns", href: "/owner/campaigns", icon: "Megaphone" },
  { name: "Reports", href: "/owner/reports", icon: "FileBarChart" },
  { name: "Ad Budget", href: "/owner/ad-budget", icon: "Wallet" },
  {
    name: "Expenses",
    href: "/owner/expenses",
    icon: "Receipt",
    children: [
      { name: "All Expenses", href: "/owner/expenses" },
      { name: "Categories", href: "/owner/expenses/categories" },
    ],
  },
  {
    name: "Users",
    href: "/owner/users",
    icon: "UsersRound",
    children: [
      { name: "All Users", href: "/owner/users" },
      { name: "Add User", href: "/owner/users/create" },
    ],
  },
  {
    name: "Leads",
    href: "/owner/leads",
    icon: "Target",
    children: [
      { name: "All Leads", href: "/owner/leads" },
      { name: "Add Lead", href: "/owner/leads/create" },
    ],
  },
  {
    name: "Deals",
    href: "/owner/deals",
    icon: "Handshake",
    children: [
      { name: "All Deals", href: "/owner/deals" },
      // { name: "Pipeline", href: "/owner/deals/pipeline" },
    ],
  },
  { name: "Follow-ups", href: "/owner/follow-ups", icon: "PhoneForwarded" },
  {
    name: "Clients",
    href: "/owner/clients",
    icon: "Building2",
    children: [
      { name: "All Clients", href: "/owner/clients" },
      { name: "Add Client", href: "/owner/clients/create" },
    ],
  },
  {
    name: "Projects",
    href: "/owner/projects",
    icon: "FolderKanban",
    children: [
      { name: "All Projects", href: "/owner/projects" },
      { name: "Add Project", href: "/owner/projects/create" },
    ],
  },
  {
    name: "Teams",
    href: "/owner/teams",
    icon: "Users",
    children: [
      { name: "All Teams", href: "/owner/teams" },
      { name: "Add Team", href: "/owner/teams/create" },
    ],
  },
  {
    name: "Services",
    href: "/owner/services",
    icon: "PackageCheck",
    children: [
      { name: "All Services", href: "/owner/services" },
      { name: "Add Service", href: "/owner/services/create" },
    ],
  },
  {
    name: "Samples",
    href: "/owner/samples",
    icon: "Layers",
    children: [
      { name: "All Samples", href: "/owner/samples" },
      { name: "Add Sample", href: "/owner/samples/create" },
    ],
  },
  {
    name: "Attendance",
    href: "/owner/attendance",
    icon: "Clock",
    children: [
      { name: "Daily Sheet", href: "/owner/attendance" },
      { name: "My Attendance", href: "/owner/my-attendance" },
      { name: "Holidays", href: "/owner/holidays" },
    ],
  },
  {
    name: "Leave",
    href: "/owner/leave-requests",
    icon: "FileText",
    children: [
      { name: "Apply Leave", href: "/owner/my-leaves" },
      { name: "Requests", href: "/owner/leave-requests" },
      { name: "Types", href: "/owner/leave-types" },
      { name: "Balances", href: "/owner/leave-balances" },
    ],
  },
  { name: "Invoices", href: "/owner/invoices", icon: "ReceiptText" },
  { name: "Settings", href: "/owner/settings", icon: "Settings" },
];

export default async function OwnerLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["OWNER"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <CopilotWrapper>
        <DashboardShell title="Owner Dashboard" navItems={navItems}>
          <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
        </DashboardShell>
      </CopilotWrapper>
    </AuthProvider>
  );
}
