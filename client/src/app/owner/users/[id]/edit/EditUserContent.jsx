"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield, Lock, Eye, EyeOff, KeyRound } from "lucide-react";

import { updateUser, resetUserPassword } from "@/actions/users.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

const ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager" },
  { value: "FINANCE_MANAGER", label: "Finance Manager" },
  { value: "HR", label: "HR" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "CLIENT", label: "Client" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "INVITED", label: "Invited" },
];

export default function EditUserContent({ user }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "EMPLOYEE",
    status: user.status || "ACTIVE",
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.email) {
      showToast("error", "Please fill all required fields");
      return;
    }

    startTransition(async () => {
      const result = await updateUser(user.id, form);
      if (result.success) {
        showToast("success", "User updated successfully");
      } else {
        showToast("error", result.error || "Failed to update user");
      }
    });
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showToast("error", "Password must be at least 8 characters");
      return;
    }

    setIsResetting(true);
    const result = await resetUserPassword(user.id, newPassword);
    setIsResetting(false);

    if (result.success) {
      showToast("success", "Password reset successfully. User will need to re-login.");
      setNewPassword("");
    } else {
      showToast("error", result.error || "Failed to reset password");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title={`Edit — ${user.firstName} ${user.lastName}`}
        description={`Editing profile for ${user.email}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Users", href: "/owner/users" },
          { label: `${user.firstName} ${user.lastName}`, href: `/owner/users/${user.id}` },
          { label: "Edit" },
        ]}
      />

      {/* Personal Information */}
      <SettingsCard
        title="Personal Information"
        description="Update the user's personal details."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsInput
            label="First Name *"
            icon={User}
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder="John"
          />
          <SettingsInput
            label="Last Name *"
            icon={User}
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder="Doe"
          />
          <SettingsInput
            label="Email Address *"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john@company.com"
          />
          <SettingsInput
            label="Phone"
            icon={Phone}
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+91 98765-43210"
          />
        </div>
      </SettingsCard>

      {/* Role & Access */}
      <SettingsCard
        title="Role & Access"
        description="Modify the user's role and account status."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSelect
            label="Role"
            icon={Shield}
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            options={ROLES}
          />
          <SettingsSelect
            label="Status"
            icon={Shield}
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            options={STATUSES}
          />
        </div>
      </SettingsCard>

      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <SettingsButton
          isPending={isPending}
          onClick={handleSave}
          label="Save Changes"
        />
      </div>

      {/* Reset Password */}
      <SettingsCard
        title="Reset Password"
        description="Force a password reset. The user will be logged out of all sessions."
      >
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <SettingsInput
              label="New Password"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
          <button
            onClick={handleResetPassword}
            disabled={isResetting || !newPassword}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <KeyRound className="w-4 h-4" />
            {isResetting ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
