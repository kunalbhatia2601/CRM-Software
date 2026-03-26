"use server";

import { cookies } from "next/headers";
import { updateProfileAPI, changePasswordAPI } from "@/lib/api";

/**
 * Update own profile (firstName, lastName, phone, avatar).
 */
export async function updateProfile(data) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const res = await updateProfileAPI(data, token);
    // Update the non-httpOnly user cookie with new info
    if (res.data) {
      cookieStore.set(
        "user",
        JSON.stringify({
          id: res.data.id,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          email: res.data.email,
          role: res.data.role,
          avatar: res.data.avatar || null,
        }),
        {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }
      );
    }
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.message || "Failed to update profile" };
  }
}

/**
 * Change own password (requires current password).
 */
export async function changePassword(currentPassword, newPassword) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    await changePasswordAPI(token, currentPassword, newPassword);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to change password" };
  }
}
