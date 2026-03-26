"use server";

import { cookies } from "next/headers";
import { getUploadConfigAPI } from "@/lib/api";

/**
 * Get upload configuration from the server.
 * Returns the upload URL, method, headers, etc. based on the active storage provider.
 */
export async function getUploadConfig({ filename, contentType, fileSize } = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return { success: false, error: "Not authenticated" };

  try {
    const params = {};
    if (filename) params.filename = filename;
    if (contentType) params.contentType = contentType;
    if (fileSize) params.fileSize = String(fileSize);

    const res = await getUploadConfigAPI(params, token);
    if (res.success) {
      // Pass the token to the client so XHR can set Authorization header
      // (needed for LOCAL uploads — the cookie is httpOnly so JS can't read it)
      return { success: true, data: { ...res.data, _token: token } };
    }
    return { success: false, error: res.message };
  } catch (err) {
    return { success: false, error: err.message || "Failed to get upload config" };
  }
}
