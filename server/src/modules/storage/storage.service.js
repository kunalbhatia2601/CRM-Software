import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import settingsService from "../settings/settings.service.js";
import { ApiError } from "../../utils/apiError.js";

// Upload directory for local storage
const localPath = "public/uploads";
const LOCAL_UPLOAD_DIR = path.resolve(localPath);

class StorageService {
  /**
   * Get the raw (unmasked) storage config from settings.
   */
  async _getConfig() {
    const settings = await settingsService.getRawSettings();
    return settings;
  }

  /**
   * Build an S3Client from stored credentials (works for both AWS S3 and Cloudflare R2).
   */
  _buildS3Client(config) {
    const clientConfig = {
      region: config.storageRegion || "auto",
      credentials: {
        accessKeyId: config.storageAccessKeyId,
        secretAccessKey: config.storageSecretKey,
      },
    };

    if (config.storageEndpoint) {
      clientConfig.endpoint = config.storageEndpoint;
      clientConfig.forcePathStyle = false; // R2 uses virtual-hosted style
    }

    return new S3Client(clientConfig);
  }

  /**
   * Generate a unique storage key (file path in bucket).
   * Format: uploads/<year>/<month>/<uuid>-<sanitizedFilename>
   */
  _generateKey(originalFilename) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const ext = path.extname(originalFilename || "file").toLowerCase();
    const safeName = (originalFilename || "file")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 100);
    return `${year}/${month}/${uuid}-${safeName}`;
  }

  /**
   * Get a presigned PUT URL so the client can upload directly to S3/R2.
   * This avoids the file passing through our server — critical for 5-10 GB files.
   *
   * Returns: { uploadUrl, fileUrl, key, method: "PUT" }
   */
  async getPresignedUploadUrl(filename, contentType, fileSize) {
    const config = await this._getConfig();
    const provider = config.storageProvider;

    if (provider !== "S3" && provider !== "R2") {
      throw ApiError.badRequest("Presigned URLs are only available for S3/R2 providers");
    }

    if (!config.storageAccessKeyId || !config.storageSecretKey || !config.storageBucket) {
      throw ApiError.badRequest("Storage is not configured. Please set up S3/R2 credentials in settings.");
    }

    const s3 = this._buildS3Client(config);
    const key = this._generateKey(filename);

    const command = new PutObjectCommand({
      Bucket: config.storageBucket,
      Key: key,
      ContentType: contentType || "application/octet-stream",
      ...(fileSize ? { ContentLength: parseInt(fileSize) } : {}),
    });

    // Presigned URL valid for 2 hours (enough for very large files)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 7200 });

    // Build the public file URL
    let fileUrl;
    if (config.storagePublicUrl) {
      // Custom CDN / public URL prefix
      const base = config.storagePublicUrl.replace(/\/$/, "");
      fileUrl = `${base}/${key}`;
    } else if (config.storageEndpoint) {
      // R2 or custom S3 endpoint
      fileUrl = `${config.storageEndpoint}/${config.storageBucket}/${key}`;
    } else {
      // Standard AWS S3
      fileUrl = `https://${config.storageBucket}.s3.${config.storageRegion || "us-east-1"}.amazonaws.com/${key}`;
    }

    return {
      uploadUrl,
      fileUrl,
      key,
      method: "PUT",
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
    };
  }

  /**
   * Get upload config for the CUSTOM provider.
   * Returns the POST URL, file key, and URL key so the client can upload directly.
   *
   * Returns: { uploadUrl, fileKey, urlKey, method: "POST" }
   */
  async getCustomUploadConfig() {
    const config = await this._getConfig();

    if (config.storageProvider !== "CUSTOM") {
      throw ApiError.badRequest("Custom upload config is only for CUSTOM provider");
    }

    if (!config.storageCustomPostUrl || !config.storageCustomFileKey || !config.storageCustomUrlKey) {
      throw ApiError.badRequest("Custom storage is not configured. Set the POST URL, file key, and URL key in settings.");
    }

    return {
      uploadUrl: config.storageCustomPostUrl,
      fileKey: config.storageCustomFileKey,
      urlKey: config.storageCustomUrlKey,
      method: "POST",
    };
  }

  /**
   * Handle local file upload via streaming.
   * The file is piped directly to disk without buffering the entire file in memory.
   *
   * @param {import('express').Request} req - Express request with file stream
   * @returns {{ fileUrl: string, key: string }}
   */
  async handleLocalUpload(req) {
    const config = await this._getConfig();

    if (config.storageProvider !== "LOCAL") {
      throw ApiError.badRequest("Local upload is only available when storage provider is LOCAL");
    }

    const filename = req.headers["x-filename"] || "file";
    const key = this._generateKey(filename);
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    await fs.promises.mkdir(dir, { recursive: true });

    // Stream the request body directly to disk
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);

      req.pipe(writeStream);

      writeStream.on("finish", () => {
        // Build the local file URL — served by express static or a dedicated route
        const fileUrl = `/${localPath}/${key}`;
        resolve({ fileUrl, key });
      });

      writeStream.on("error", (err) => {
        // Clean up partial file
        fs.unlink(filePath, () => {});
        reject(new ApiError(500, `Failed to save file: ${err.message}`));
      });

      req.on("error", (err) => {
        writeStream.destroy();
        fs.unlink(filePath, () => {});
        reject(new ApiError(400, `Upload stream error: ${err.message}`));
      });
    });
  }

  /**
   * Serve a local file by key.
   */
  async getLocalFile(key) {
    const filePath = path.join(LOCAL_UPLOAD_DIR, key);

    // Security: ensure the resolved path is still within LOCAL_UPLOAD_DIR
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(LOCAL_UPLOAD_DIR))) {
      throw ApiError.badRequest("Invalid file path");
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      throw ApiError.notFound("File not found");
    }

    return resolved;
  }

  /**
   * Get the current storage provider config for the frontend.
   * Returns { provider, isConfigured } + provider-specific upload info.
   */
  async getUploadConfig(filename, contentType, fileSize) {
    const config = await this._getConfig();
    const provider = config.storageProvider;

    switch (provider) {
      case "S3":
      case "R2":
        return {
          provider,
          ...(await this.getPresignedUploadUrl(filename, contentType, fileSize)),
        };

      case "CUSTOM":
        return {
          provider,
          ...(await this.getCustomUploadConfig()),
        };

      case "LOCAL":
      default:
        return {
          provider: "LOCAL",
          uploadUrl: "/api/storage/upload/local",
          method: "POST",
          headers: {
            "x-filename": filename || "file",
          },
        };
    }
  }
}

export default new StorageService();
