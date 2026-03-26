import prisma from "../../utils/prisma.js";
import cache from "../../utils/cache.js";
import { clearTransporterCache } from "../../utils/mailer.js";

const CACHE_KEY = "settings";
const CACHE_KEY_RAW = "settings:raw"; // Unmasked version for internal use
const CACHE_TTL = 600; // 10 minutes
const MASK = "••••••••";

class SettingsService {
  /**
   * Get RAW settings from DB (with real passwords — for internal use only).
   * Cached for 10 minutes.
   */
  async getRawSettings() {
    return cache.get(CACHE_KEY_RAW, async () => {
      let settings = await prisma.settings.findUnique({
        where: { id: "default" },
      });
      if (!settings) {
        settings = await prisma.settings.create({ data: { id: "default" } });
      }
      return settings;
    }, CACHE_TTL);
  }

  /**
   * Get settings (auto-creates default record if none exists)
   * Masks sensitive fields for security.
   * Uses cached raw settings internally.
   */
  async getSettings() {
    const settings = await this.getRawSettings();
    const { createdAt, updatedAt, ...data } = settings;

    return {
      ...data,
      // Mask SMTP password
      smtpPassword: data.smtpPassword ? MASK : null,
      isSmtpConfigured: !!(
        data.smtpHost &&
        data.smtpPort &&
        data.smtpEmail &&
        data.smtpPassword
      ),
      // Mask storage secret key
      storageSecretKey: data.storageSecretKey ? MASK : null,
      isStorageConfigured: this._checkStorageConfigured(data),
    };
  }

  /**
   * Update settings (OWNER only)
   * If passwords are the masked string, skip updating them.
   * Invalidates cache after update.
   */
  async updateSettings(data) {
    // Don't overwrite secrets with the mask
    if (data.smtpPassword === MASK) delete data.smtpPassword;
    if (data.storageSecretKey === MASK) delete data.storageSecretKey;

    // Track if SMTP fields are being changed
    const smtpFieldsChanged = !!(
      data.smtpHost !== undefined ||
      data.smtpPort !== undefined ||
      data.smtpEmail !== undefined ||
      data.smtpPassword !== undefined ||
      data.smtpIsSecure !== undefined
    );

    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: "default", ...data },
      });
    } else {
      settings = await prisma.settings.update({
        where: { id: "default" },
        data,
      });
    }

    // Invalidate settings cache
    cache.del(CACHE_KEY);
    cache.del(CACHE_KEY_RAW);

    // Clear cached nodemailer transporter if SMTP config changed
    if (smtpFieldsChanged) {
      clearTransporterCache();
    }

    const { createdAt, updatedAt, ...result } = settings;

    return {
      ...result,
      smtpPassword: result.smtpPassword ? MASK : null,
      isSmtpConfigured: !!(
        result.smtpHost &&
        result.smtpPort &&
        result.smtpEmail &&
        result.smtpPassword
      ),
      storageSecretKey: result.storageSecretKey ? MASK : null,
      isStorageConfigured: this._checkStorageConfigured(result),
    };
  }

  /**
   * Check if storage is fully configured based on provider type.
   */
  _checkStorageConfigured(data) {
    const p = data.storageProvider;
    if (p === "LOCAL") return true;
    if (p === "S3" || p === "R2") {
      return !!(
        data.storageAccessKeyId &&
        data.storageSecretKey &&
        data.storageBucket
      );
    }
    if (p === "CUSTOM") {
      return !!(
        data.storageCustomPostUrl &&
        data.storageCustomFileKey &&
        data.storageCustomUrlKey
      );
    }
    return false;
  }
}

export default new SettingsService();
