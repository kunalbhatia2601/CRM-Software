import nodemailer from "nodemailer";
import cache from "./cache.js";
import prisma from "./prisma.js";

/**
 * Mailer Utility — reads SMTP config from the cached Settings,
 * creates a nodemailer transporter (also cached), and sends emails.
 * Fully modular: all email sending goes through sendMail().
 */

let _cachedTransporter = null;
let _cachedConfigHash = null;

/**
 * Build a hash string from SMTP config to detect changes.
 */
function configHash(cfg) {
  return `${cfg.smtpHost}:${cfg.smtpPort}:${cfg.smtpEmail}:${cfg.smtpIsSecure}`;
}

/**
 * Get raw settings from the cache (same cache key as settings.service.js).
 * Falls back to DB if cache is empty.
 */
async function getCachedSettings() {
  return cache.get("settings:raw", async () => {
    let settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "default" } });
    }
    return settings;
  }, 600);
}

/**
 * Get cached site data (same cache key as site.service.js).
 */
async function getCachedSite() {
  return cache.get("site", async () => {
    let site = await prisma.site.findUnique({ where: { id: "default" } });
    if (!site) {
      site = await prisma.site.create({ data: { id: "default" } });
    }
    return site;
  }, 600);
}

/**
 * Get or create a nodemailer transporter using cached SMTP settings.
 */
async function getTransporter() {
  const settings = await getCachedSettings();

  if (!settings?.smtpHost || !settings?.smtpPort || !settings?.smtpEmail || !settings?.smtpPassword) {
    throw new Error("SMTP is not configured. Please configure SMTP settings first.");
  }

  const hash = configHash(settings);

  // Reuse cached transporter if config hasn't changed
  if (_cachedTransporter && _cachedConfigHash === hash) {
    return { transporter: _cachedTransporter, fromEmail: settings.smtpEmail };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpIsSecure,
    auth: {
      user: settings.smtpEmail,
      pass: settings.smtpPassword,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  });

  _cachedTransporter = transporter;
  _cachedConfigHash = hash;

  return { transporter, fromEmail: settings.smtpEmail };
}

/**
 * Send an email using the configured SMTP transport.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient email
 * @param {string} options.subject  - Email subject
 * @param {string} options.html     - HTML body
 * @param {string} [options.text]   - Plain text fallback
 * @param {string} [options.from]   - Override sender (default: SMTP email)
 */
export async function sendMail({ to, subject, html, text, from }) {
  const { transporter, fromEmail } = await getTransporter();

  const site = await getCachedSite();
  const siteName = site?.name || "TaskGo Agency";

  const info = await transporter.sendMail({
    from: from || `"${siteName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""),
  });

  return info;
}

/**
 * Verify SMTP connection is working.
 */
export async function verifySmtp() {
  const { transporter } = await getTransporter();
  await transporter.verify();
  return true;
}

/**
 * Clear the cached transporter (call after SMTP settings change).
 */
export function clearTransporterCache() {
  _cachedTransporter = null;
  _cachedConfigHash = null;
}
