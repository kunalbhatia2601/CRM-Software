import prisma from "../../utils/prisma.js";
import cache from "../../utils/cache.js";
import { clearTransporterCache } from "../../utils/mailer.js";

const CACHE_KEY = "settings";
const CACHE_KEY_RAW = "settings:raw"; // Unmasked version for internal use
const CACHE_TTL = 600; // 10 minutes

class SettingsService {
  /**
   * Get RAW settings from DB (with real password — for internal use only).
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
   * Masks the SMTP password for security.
   * Uses cached raw settings internally.
   */
  async getSettings() {
    const settings = await this.getRawSettings();
    const { createdAt, updatedAt, ...data } = settings;

    // Mask SMTP password — only show if configured or not
    return {
      ...data,
      smtpPassword: data.smtpPassword ? "••••••••" : null,
      isSmtpConfigured: !!(
        data.smtpHost &&
        data.smtpPort &&
        data.smtpEmail &&
        data.smtpPassword
      ),
    };
  }

  /**
   * Update settings (OWNER only)
   * If smtpPassword is the masked string, skip updating it.
   * Invalidates cache after update.
   */
  async updateSettings(data) {
    // Don't overwrite password with the mask
    if (data.smtpPassword === "••••••••") {
      delete data.smtpPassword;
    }

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
      smtpPassword: result.smtpPassword ? "••••••••" : null,
      isSmtpConfigured: !!(
        result.smtpHost &&
        result.smtpPort &&
        result.smtpEmail &&
        result.smtpPassword
      ),
    };
  }
}

export default new SettingsService();
