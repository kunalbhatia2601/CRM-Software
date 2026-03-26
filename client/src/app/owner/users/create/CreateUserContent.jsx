"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield, Lock, Eye, EyeOff, Building2, Camera, Loader2, ImageIcon, X } from "lucide-react";

import { createUser, getClientsDropdown } from "@/actions/users.action";
import { useUpload } from "@/hooks/useUpload";
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
  const [clients, setClients] = useState([]);
  const { upload, uploading, progress } = useUpload();
  const avatarInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "EMPLOYEE",
    status: "ACTIVE",
    clientId: "",
    avatar: "",
  });

  // Fetch clients for dropdown when role is CLIENT
  useEffect(() => {
    if (form.role === "CLIENT" && clients.length === 0) {
      getClientsDropdown().then((data) => setClients(data));
    }
  }, [form.role]);

  const update = (field, value) => {
    setForm((p) => {
      const next = { ...p, [field]: value };
      // Clear clientId when role changes away from CLIENT
      if (field === "role" && value !== "CLIENT") next.clientId = "";
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setToast({ type: "error", message: "Please fill all required fields" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    startTransition(async () => {
      const payload = { ...form };
      if (payload.role !== "CLIENT" || !payload.clientId) delete payload.clientId;
      if (!payload.avatar) delete payload.avatar;
      const result = await createUser(payload);
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
        {/* Avatar Upload */}
        <div className="flex items-center gap-5 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div className={`${form.avatar ? "hidden" : "flex"} items-center justify-center w-full h-full`}>
                <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const result = await upload(file);
                if (result?.fileUrl) update("avatar", result.fileUrl);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </button>
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-2xl overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Profile Photo</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Optional. PNG, JPG or WebP.</p>
            {form.avatar && (
              <button
                type="button"
                onClick={() => update("avatar", "")}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            )}
          </div>
        </div>

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

      {/* Link to Client (only when role is CLIENT) */}
      {form.role === "CLIENT" && (
        <SettingsCard
          title="Link to Client"
          description="Associate this user with a client company so they can access their projects and deals."
        >
          <div className="max-w-md">
            <SettingsSelect
              label="Client Company"
              icon={Building2}
              value={form.clientId}
              onChange={(e) => update("clientId", e.target.value)}
              options={[
                { value: "", label: "— Select a client (optional) —" },
                ...clients.map((c) => ({
                  value: c.id,
                  label: `${c.companyName}${c.contactName ? ` — ${c.contactName}` : ""}`,
                })),
              ]}
            />
            <p className="text-xs text-slate-400 mt-2">
              If the client company doesn't exist yet, you can link it later from the edit page.
            </p>
          </div>
        </SettingsCard>
      )}

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
          className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
