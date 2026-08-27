import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Marketing Panel — ${name}`, robots: { index: false, follow: false } };
}

const navItems = [
  { name: "Dashboard", href: "/marketing/dashboard", icon: "LayoutDashboard" },
  { name: "Campaigns", href: "/marketing/campaigns", icon: "Megaphone" },
  { name: "Ad Budget", href: "/marketing/ad-budget", icon: "Wallet" },
  { name: "Leads", href: "/marketing/leads", icon: "Target" },
  { name: "Deals", href: "/marketing/deals", icon: "Handshake" },
  { name: "Clients", href: "/marketing/clients", icon: "Building2" },
  { name: "Projects", href: "/marketing/projects", icon: "FolderKanban" },
  { name: "Meetings", href: "/marketing/meetings", icon: "Calendar" },
  { name: "My Expenses", href: "/marketing/expenses", icon: "Receipt" },
  { name: "My Attendance", href: "/marketing/my-attendance", icon: "Clock" },
  { name: "Apply Leave", href: "/marketing/my-leaves", icon: "FileText" },
];

export default async function AccountsLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN", "MARKETING_MANAGER"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell title="Marketing Panel" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
