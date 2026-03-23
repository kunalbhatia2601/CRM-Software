import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuthUser } from "@/actions/auth.action";
import { getSiteAPI } from "@/lib/api";
import LoginForm from "@/components/auth/LoginForm";
import LoginBranding from "@/components/auth/LoginBranding";

// Role → dashboard path (duplicated for server-side redirect)
const ROLE_DASHBOARD_MAP = {
  OWNER: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  SALES_MANAGER: "/sales/dashboard",
  ACCOUNT_MANAGER: "/accounts/dashboard",
  FINANCE_MANAGER: "/finance/dashboard",
  HR: "/hr/dashboard",
  EMPLOYEE: "/employee/dashboard",
  CLIENT: "/client/dashboard",
};

export const metadata = {
  title: "Login — TaskGo Agency",
  description: "Sign in to your TaskGo account",
};

export default async function LoginPage() {
  // If already authenticated, redirect to their dashboard
  const user = await getAuthUser();
  if (user) {
    redirect(ROLE_DASHBOARD_MAP[user.role] || "/dashboard");
  }

  // Fetch site data for branding
  let siteData = null;
  try {
    const res = await getSiteAPI();
    if (res.success) siteData = res.data;
  } catch {
    // Silently fall back to defaults
  }

  const data = siteData || {
    name: "TaskGo Agency",
    logo: null,
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left — Branding Panel */}
      <LoginBranding siteData={data} />

      {/* Right — Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Subtle background to match landing page feel */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
             style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(96, 73, 231, 0.08), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(147, 211, 250, 0.06), transparent 50%)" }} />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10">
            <Link href="/" className="flex items-center gap-2">
              {data.logo ? (
                <img src={data.logo} alt={data.name} className="h-7" />
              ) : (
                <Image
                  src="/images/frame-9.svg"
                  alt="TaskGo"
                  width={148}
                  height={36}
                  className="w-[148px]"
                  style={{ height: "auto" }}
                />
              )}
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-[28px] font-semibold text-dark tracking-[-0.56px]">
              Welcome back
            </h2>
            <p className="text-gray text-[16px] leading-[150%] mt-2">
              Sign in to your account to continue
            </p>
          </div>

          {/* Login Form (Client Component) */}
          <LoginForm />

          {/* Footer text */}
          <p className="mt-8 text-center text-[14px] text-gray">
            Don&apos;t have an account?{" "}
            <span className="text-gray/60">
              Contact your administrator for access.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
