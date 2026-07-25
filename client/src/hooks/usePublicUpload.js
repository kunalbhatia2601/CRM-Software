"use client";

import { useState, useCallback } from "react";
import { getPublicUploadConfigAPI } from "@/lib/api";

let SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4444";

/**
 * Public (no-auth) file upload — for the careers/apply flow.
 * Mirrors useUpload but hits the /api/storage/public/* endpoints and never
 * sends an Authorization header. Supports LOCAL / S3 / R2 / CUSTOM.
 *
 * Returns { fileUrl, key } on success, null on failure.
 */
export function usePublicUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file) => {
    if (!file) { setError("No file provided"); return null; }
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const res = await getPublicUploadConfigAPI({
        filename: file.name,
        contentType: file.type,
        fileSize: String(file.size),
      });
      if (!res.success) throw new Error(res.message || "Failed to get upload config");
      const config = res.data;

      const provider = config.provider;
      if (provider === "S3" || provider === "R2") {
        return await putPresigned(file, config, setProgress);
      }
      if (provider === "CUSTOM") {
        return await postCustom(file, config, setProgress);
      }
      // LOCAL — force the public endpoint (config.uploadUrl is the auth one).
      return await postLocalPublic(file, setProgress);
    } catch (err) {
      setError(err.message || "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, progress, error };
}

function putPresigned(file, config, setProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100)));
    xhr.addEventListener("load", () => (xhr.status >= 200 && xhr.status < 300)
      ? resolve({ fileUrl: config.fileUrl, key: config.key })
      : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("PUT", config.uploadUrl);
    xhr.setRequestHeader("Content-Type", config.headers?.["Content-Type"] || file.type);
    xhr.send(file);
  });
}

function postCustom(file, config, setProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append(config.fileKey, file);
    xhr.upload.addEventListener("progress", (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100)));
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const r = JSON.parse(xhr.responseText);
          const fileUrl = (config.urlKey || "").split(".").reduce((c, k) => c?.[k], r);
          fileUrl ? resolve({ fileUrl, key: null }) : reject(new Error("Response missing file URL"));
        } catch { reject(new Error("Invalid response")); }
      } else reject(new Error(`Upload failed (${xhr.status})`));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", config.uploadUrl);
    xhr.send(fd);
  });
}

function postLocalPublic(file, setProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100)));
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const r = JSON.parse(xhr.responseText);
          const data = r.data || r;
          const fileUrl = data.fileUrl?.startsWith("/") ? `${SERVER_URL}${data.fileUrl}` : data.fileUrl;
          resolve({ fileUrl, key: data.key });
        } catch { reject(new Error("Invalid response")); }
      } else reject(new Error(`Upload failed (${xhr.status})`));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.open("POST", `${SERVER_URL}/api/storage/public/upload/local`);
    xhr.setRequestHeader("x-filename", file.name);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}
