"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield, Lock, Eye, EyeOff } from "lucide-react";

import { createUser } from "@/actions/users.action";
import PageHeader from "@/components/ui/PageHeader";
import Toast from "@/components/ui/Toast";
import SettingsCard from "@/components/settings/SettingsCard";
import SettingsInput from "@/components/settings/SettingsInput";
import SettingsSelect from "@/components/settings/SettingsSelect";
import SettingsButton from "@/components/settings/SettingsButton";

const ROLES = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "ADMIN", label: "Admin" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager" },
  { value: "FINANCE_MANAGER", label: "Finance Manager" },
  { value: "HR", label: "HR" },
  { value: "CLIENT", label: "Client" },
];

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "INVITED", label: "Invited" },
];

export default function CreateUserContent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "EMPLOYEE",
    status: "ACTIVE",
  });

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setToast({ type: "error", message: "Please fill all required fields" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    startTransition(async () => {
      const result = await createUser(form);
      if (result.success) {
        router.push("/owner/users");
      } else {
        setToast({ type: "error", message: result.error || "Failed to create user" });
        setTimeout(() => setToast(null), 4000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <PageHeader
        title="Create User"
        description="Add a new team member or client to your organization."
        breadcrumbs={[
          { label: "Dashboard", href: "/owner/dashboard" },
          { label: "Users", href: "/owner/users" },
          { label: "Create User" },
        ]}
      />

      {/* Personal Information */}
      <SettingsCard
        title="Personal Information"
        description="Basic details for the new user account."
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
        description="Set the user's role and account status."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsSelect
            label="Role *"
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

      {/* Password */}
      <SettingsCard
        title="Set Password"
        description="Create a secure password (min 8 characters)."
      >
        <div className="max-w-md">
          <SettingsInput
            label="Password *"
            type={showPassword ? "text" : "password"}
            icon={Lock}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
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
      </SettingsCard>

      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <SettingsButton
          isPending={isPending}
          onClick={handleSubmit}
          label="Create User"
        />
      </div>
    </div>
  );
}
