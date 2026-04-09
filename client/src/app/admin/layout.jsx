import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Admin Panel — ${name}` };
}

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  {
    name: "Leads",
    href: "/admin/leads",
    icon: "Target",
    children: [
      { name: "All Leads", href: "/admin/leads" },
      { name: "Add Lead", href: "/admin/leads/create" },
    ],
  },
  {
    name: "Deals",
    href: "/admin/deals",
    icon: "Handshake",
    children: [
      { name: "All Deals", href: "/admin/deals" },
    ],
  },
  {
    name: "Clients",
    href: "/admin/clients",
    icon: "Building2",
    children: [
      { name: "All Clients", href: "/admin/clients" },
      { name: "Add Client", href: "/admin/clients/create" },
    ],
  },
  {
    name: "Projects",
    href: "/admin/projects",
    icon: "FolderKanban",
    children: [
      { name: "All Projects", href: "/admin/projects" },
      { name: "Add Project", href: "/admin/projects/create" },
    ],
  },
  {
    name: "Teams",
    href: "/admin/teams",
    icon: "Users",
    children: [
      { name: "All Teams", href: "/admin/teams" },
      { name: "Add Team", href: "/admin/teams/create" },
    ],
  },
  {
    name: "Services",
    href: "/admin/services",
    icon: "PackageCheck",
    children: [
      { name: "All Services", href: "/admin/services" },
      { name: "Add Service", href: "/admin/services/create" },
    ],
  },
  {
    name: "Samples",
    href: "/admin/samples",
    icon: "Layers",
    children: [
      { name: "All Samples", href: "/admin/samples" },
      { name: "Add Sample", href: "/admin/samples/create" },
    ],
  },
];

export default async function AdminLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell title="Admin Panel" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
