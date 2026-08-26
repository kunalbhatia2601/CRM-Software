import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteData } from "@/actions/site.action";
import { AuthProvider } from "@/context/AuthContext";
import DashboardShell from "@/components/dashboard/DashboardShell";

export async function generateMetadata() {
  const siteData = await getSiteData();
  const name = siteData?.name || "TaskGo Agency";
  return { title: `Finance Panel — ${name}`, robots: { index: false, follow: false } };
}

const navItems = [
  { name: "Dashboard", href: "/finance/dashboard", icon: "LayoutDashboard" },
  { name: "Expenses", href: "/finance/expenses", icon: "Receipt" },
  { name: "Invoices", href: "/finance/invoices", icon: "ReceiptText" },
  { name: "Clients", href: "/finance/clients", icon: "Building2" },
  { name: "Projects", href: "/finance/projects", icon: "FolderKanban" },
  { name: "Payroll", href: "/finance/payroll", icon: "Wallet" },
  { name: "Meetings", href: "/finance/meetings", icon: "Calendar" },
  { name: "My Attendance", href: "/finance/my-attendance", icon: "Clock" },
  { name: "Apply Leave", href: "/finance/my-leaves", icon: "FileText" },
];

export default async function FinanceLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  if (!["OWNER", "ADMIN", "FINANCE_MANAGER"].includes(user.role)) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <DashboardShell title="Finance Panel" navItems={navItems}>
        <div className="bg-slate-50 dark:bg-slate-950">{children}</div>
      </DashboardShell>
    </AuthProvider>
  );
}
