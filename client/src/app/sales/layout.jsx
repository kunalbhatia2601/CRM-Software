import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Sales Panel — ${name}` };
}

const navItems = [
  { name: "Dashboard", href: "/sales/dashboard", icon: "LayoutDashboard" },
  {
    name: "Leads",
    href: "/sales/leads",
    icon: "Target",
    children: [
      { name: "All Leads", href: "/sales/leads" },
      { name: "Add Lead", href: "/sales/leads/create" },
    ],
  },
  {
    name: "Deals",
    href: "/sales/deals",
    icon: "Handshake",
    children: [
      { name: "All Deals", href: "/sales/deals" },
    ],
  },
  {
    name: "Samples",
    href: "/sales/samples",
    icon: "Layers",
    children: [
      { name: "All Samples", href: "/sales/samples" },
      { name: "Add Sample", href: "/sales/samples/create" },
    ],
  },
  { name: "Documents", href: "/sales/documents", icon: "FileText" },
  { name: "Meetings", href: "/sales/meetings", icon: "Calendar" },
  { name: "Follow-ups", href: "/sales/follow-ups", icon: "PhoneForwarded" },
  { name: "Clients", href: "/sales/clients", icon: "Building2" },
  { name: "Projects", href: "/sales/projects", icon: "FolderKanban" },
];

export default async function SalesLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN", "SALES_MANAGER"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell title="Sales Panel" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
