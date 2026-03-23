import { redirect } from "next/navigation";
import { getAuthUser } from "@/actions/auth.action";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Admin Panel — TaskGo Agency",
};

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
      <div className="min-h-screen bg-slate-50">{children}</div>
    </AuthProvider>
  );
}
