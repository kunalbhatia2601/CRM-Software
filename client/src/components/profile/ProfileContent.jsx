"use client";

import { useState, useTransition, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Loader2,
  Save,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { updateProfile, changePassword } from "@/actions/profile.action";
import { useUpload } from "@/hooks/useUpload";
import Toast from "@/components/ui/Toast";

export default function ProfileContent({ user }) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);
  const { upload, uploading, progress } = useUpload();
  const fileInputRef = useRef(null);

  // Profile form state
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    avatar: user.avatar || "",
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, startPasswordTransition] = useTransition();

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const initials = `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase();

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file);
    if (result?.fileUrl) {
      update("avatar", result.fileUrl);
    }
    e.target.value = "";
  };

  const handleSaveProfile = () => {
    startTransition(async () => {
      const result = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        avatar: form.avatar || null,
      });
      if (result.success) {
        setToast({ type: "success", message: "Profile updated successfully" });
      } else {
        setToast({ type: "error", message: result.error || "Failed to update profile" });
      }
    });
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ type: "error", message: "New passwords don't match" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setToast({ type: "error", message: "Password must be at least 8 characters" });
      return;
    }

    startPasswordTransition(async () => {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setToast({ type: "success", message: "Password changed successfully. Please sign in again." });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        // After password change, all tokens are revoked — redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setToast({ type: "error", message: result.error || "Failed to change password" });
      }
    });
  };

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const ROLE_LABELS = {
    OWNER: "Owner",
    ADMIN: "Admin",
    SALES_MANAGER: "Sales Manager",
    ACCOUNT_MANAGER: "Account Manager",
    FINANCE_MANAGER: "Finance Manager",
    HR: "Human Resources",
    EMPLOYEE: "Employee",
    CLIENT: "Client",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* ═══ Profile Header Card ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtNGgtNHYyaC00di0ySDJ2NGg0djRIMnY0aDR2LTJoNHYyaDR2LTRoLTR2LTRoNHYtMmgydi0yaC00djJoLTR2Mmg0djRoNHYyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        </div>

        {/* Avatar + Info */}
        <div className="px-6 lg:px-8 pb-6 -mt-16 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-slate-950 shadow-lg overflow-hidden bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
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
                <span
                  className={`${form.avatar ? "hidden" : "flex"} items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-300 w-full h-full`}
                >
                  {initials}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              {uploading && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-2xl overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Name + Meta */}
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-3.5 h-3.5" />
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
                {user.createdAt && (
                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {formatDate(user.createdAt)}
                  </span>
                )}
              </div>
            </div>

            {form.avatar && (
              <button
                type="button"
                onClick={() => update("avatar", "")}
                className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Personal Information ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1.5">Personal Information</h2>
          <p className="text-[15px] text-slate-500 dark:text-slate-400">Update your name and contact details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">First Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="First Name"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Last Name</label>
            <div className="relative flex items-center">
              <User className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Last Name"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
              />
            </div>
          </div>

          {/* Email (read only) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[15px] font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-sm dark:shadow-none"
              />
              <Lock className="absolute right-4 w-4 h-4 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">Email cannot be changed. Contact admin if needed.</p>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Phone Number</label>
            <div className="relative flex items-center">
              <Phone className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 82848-34841"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveProfile}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 bg-[#5542F6] text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-[#4636d4] hover:shadow-indigo-500/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ═══ Change Password ═══ */}
      <div className="bg-white dark:bg-slate-950 rounded-[24px] p-6 lg:p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1.5">Change Password</h2>
          <p className="text-[15px] text-slate-500 dark:text-slate-400">Update your password. You'll be logging with new password after this.</p>
        </div>

        <div className="space-y-5 max-w-lg">
          {/* Current Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Current Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">New Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Enter new password (min 8 chars)"
                className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">Confirm New Password</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none"
              />
              {passwordForm.confirmPassword && (
                <div className="absolute right-4">
                  {passwordForm.newPassword === passwordForm.confirmPassword ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleChangePassword}
            disabled={
              isChangingPassword ||
              !passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              !passwordForm.confirmPassword
            }
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold rounded-xl shadow-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {isChangingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
