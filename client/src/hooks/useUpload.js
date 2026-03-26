"use client";

import { useState, useCallback, useRef } from "react";
import { getUploadConfig } from "@/actions/storage.action";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4444";

/**
 * Universal file upload hook.
 *
 * Works with all 4 storage providers (LOCAL, S3, R2, CUSTOM) transparently.
 * The upload flow:
 *   1. Ask the server for upload config (presigned URL or endpoint)
 *   2. Upload the file directly from the browser to the target
 *   3. Return the file URL
 *
 * For S3/R2: Uses presigned PUT URLs — file goes directly to the bucket.
 * For CUSTOM: POSTs the file as multipart/form-data to the custom endpoint.
 * For LOCAL: Streams the raw file body to the backend.
 *
 * Supports progress tracking via XHR for all providers.
 *
 * Usage:
 *   const { upload, uploading, progress, error, reset } = useUpload();
 *
 *   const handleFile = async (file) => {
 *     const result = await upload(file);
 *     if (result) {
 *       console.log("File URL:", result.fileUrl);
 *     }
 *   };
 *
 * Returns: { fileUrl, key } on success, null on failure.
 */
export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    reset();
  }, [reset]);

  /**
   * Upload a file. Returns { fileUrl, key } on success, null on failure.
   * @param {File} file - The file to upload
   * @param {object} [options] - Optional overrides
   * @param {string} [options.contentType] - Override content type
   * @param {function} [options.onProgress] - Progress callback (0-100)
   */
  const upload = useCallback(async (file, options = {}) => {
    if (!file) {
      setError("No file provided");
      return null;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step 1: Get upload config from server
      const configResult = await getUploadConfig({
        filename: file.name,
        contentType: options.contentType || file.type,
        fileSize: file.size,
      });

      if (!configResult.success) {
        throw new Error(configResult.error || "Failed to get upload configuration");
      }

      const config = configResult.data;

      // Step 2: Upload based on provider
      let result;

      switch (config.provider) {
        case "S3":
        case "R2":
          result = await uploadPresigned(file, config, options);
          break;
        case "CUSTOM":
          result = await uploadCustom(file, config, options);
          break;
        case "LOCAL":
        default:
          result = await uploadLocal(file, config, options);
          break;
      }

      setProgress(100);
      return result;
    } catch (err) {
      const message = err.message || "Upload failed";
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Upload to S3/R2 using presigned PUT URL.
   */
  async function uploadPresigned(file, config, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      abortRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          options.onProgress?.(pct);
        }
      });

      xhr.addEventListener("load", () => {
        abortRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ fileUrl: config.fileUrl, key: config.key });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        abortRef.current = null;
        reject(new Error("Upload failed — network error"));
      });

      xhr.addEventListener("abort", () => {
        abortRef.current = null;
        reject(new Error("Upload cancelled"));
      });

      xhr.open("PUT", config.uploadUrl);
      xhr.setRequestHeader("Content-Type", config.headers?.["Content-Type"] || file.type);
      xhr.send(file);
    });
  }

  /**
   * Upload to a CUSTOM endpoint via multipart form POST.
   */
  async function uploadCustom(file, config, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      abortRef.current = xhr;

      const formData = new FormData();
      formData.append(config.fileKey, file);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          options.onProgress?.(pct);
        }
      });

      xhr.addEventListener("load", () => {
        abortRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            // Extract file URL from response using the configured key
            // Supports nested keys like "data.url" or "result.file.url"
            const fileUrl = getNestedValue(response, config.urlKey);
            if (!fileUrl) {
              reject(new Error(`Response missing file URL key "${config.urlKey}"`));
              return;
            }
            resolve({ fileUrl, key: null });
          } catch {
            reject(new Error("Invalid response from upload server"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        abortRef.current = null;
        reject(new Error("Upload failed — network error"));
      });

      xhr.addEventListener("abort", () => {
        abortRef.current = null;
        reject(new Error("Upload cancelled"));
      });

      xhr.open("POST", config.uploadUrl);
      xhr.send(formData);
    });
  }

  /**
   * Upload to LOCAL backend via raw body streaming.
   */
  async function uploadLocal(file, config, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      abortRef.current = xhr;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          options.onProgress?.(pct);
        }
      });

      xhr.addEventListener("load", () => {
        abortRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const data = response.data || response;
            // Prefix local URLs with server base
            const fileUrl = data.fileUrl?.startsWith("/")
              ? `${SERVER_URL}${data.fileUrl}`
              : data.fileUrl;
            resolve({ fileUrl, key: data.key });
          } catch {
            reject(new Error("Invalid response from server"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        abortRef.current = null;
        reject(new Error("Upload failed — network error"));
      });

      xhr.addEventListener("abort", () => {
        abortRef.current = null;
        reject(new Error("Upload cancelled"));
      });

      // Local upload sends raw body with filename in header
      const uploadUrl = config.uploadUrl.startsWith("/")
        ? `${SERVER_URL}${config.uploadUrl}`
        : config.uploadUrl;

      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("x-filename", file.name);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      // Auth token passed from server action (cookie is httpOnly, JS can't read it)
      if (config._token) {
        xhr.setRequestHeader("Authorization", `Bearer ${config._token}`);
      }

      xhr.send(file);
    });
  }

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
    abort,
  };
}

/**
 * Get a nested value from an object using dot notation.
 * e.g. getNestedValue({ data: { url: "..." } }, "data.url") => "..."
 */
function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
