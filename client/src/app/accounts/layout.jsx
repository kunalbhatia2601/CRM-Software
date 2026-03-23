import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Accounts Panel — TaskGo Agency",
};

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
      <div className="min-h-screen bg-slate-50">{children}</div>
    </AuthProvider>
  );
}
