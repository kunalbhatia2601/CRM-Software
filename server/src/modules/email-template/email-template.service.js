import prisma from "../../utils/prisma.js";
import cache from "../../utils/cache.js";
import { ApiError } from "../../utils/apiError.js";

const CACHE_PREFIX = "emailTpl:";
const CACHE_ALL_KEY = "emailTpl:all";
const CACHE_ALL_COUNT_KEY = "emailTpl:count";
const CACHE_TTL = 600; // 10 minutes

/**
 * Default templates seeded on first access.
 * Body uses Handlebars-style {{variable}} placeholders.
 */
export const DEFAULT_TEMPLATES = [
  {
    slug: "login-otp",
    name: "Login OTP",
    subject: "Your Login OTP — {{siteName}}",
    description: "Sent when a user logs in with OTP enabled.",
    variables: JSON.stringify(["otpCode", "userName", "siteName", "expiryMins", "otpDigits"]),
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 32px 28px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">{{siteName}}</h1>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Secure Login Verification</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#334155;font-size:15px;">Hello <strong>{{userName}}</strong>,</p>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">Use the code below to complete your sign-in. This code expires in <strong>{{expiryMins}} minutes</strong>.</p>
      <!-- OTP Box -->
      <div style="background:#f8fafc;border:2px dashed #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1e293b;font-family:'Courier New',monospace;">{{otpCode}}</span>
      </div>
      <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; {{siteName}} — All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "welcome-user",
    name: "Welcome User",
    subject: "Welcome to {{siteName}}!",
    description: "Sent when a new user account is created.",
    variables: JSON.stringify(["userName", "userEmail", "siteName", "loginUrl", "tempPassword"]),
    body: "",
  },
  {
    slug: "reset-password",
    name: "Reset Password",
    subject: "Reset Your Password — {{siteName}}",
    description: "Sent when a user requests a password reset.",
    variables: JSON.stringify(["userName", "siteName", "resetLink", "expiryMins"]),
    body: "",
  },
  {
    slug: "new-lead",
    name: "New Lead Notification",
    subject: "New Lead Assigned — {{companyName}}",
    description: "Sent when a new lead is assigned to a team member.",
    variables: JSON.stringify(["userName", "siteName", "companyName", "contactName", "leadSource", "leadUrl"]),
    body: "",
  },
  {
    slug: "document-shared",
    name: "Document Shared",
    subject: "{{documentName}} — {{siteName}}",
    description: "Sent when a proposal or document is shared with a client via email.",
    variables: JSON.stringify(["siteName", "senderName", "senderEmail", "documentName", "documentType", "documentVersion", "dealTitle", "message", "viewUrl"]),
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#5542F6 0%,#7C3AED 100%);padding:32px 32px 28px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">{{siteName}}</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Document Shared</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 20px;color:#334155;font-size:15px;"><strong>{{senderName}}</strong> has shared a document with you.</p>
      <!-- Document Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 12px;color:#1e293b;font-size:17px;font-weight:700;">{{documentName}}</h2>
        <table style="width:100%;font-size:13px;color:#64748b;">
          <tr><td style="padding:3px 0;font-weight:600;width:80px;">Type:</td><td>{{documentType}}</td></tr>
          <tr><td style="padding:3px 0;font-weight:600;">Version:</td><td>v{{documentVersion}}</td></tr>
          <tr><td style="padding:3px 0;font-weight:600;">Deal:</td><td>{{dealTitle}}</td></tr>
          <tr><td style="padding:3px 0;font-weight:600;">Sent by:</td><td>{{senderName}}</td></tr>
        </table>
      </div>
      {{#if message}}
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">{{message}}</p>
      </div>
      {{/if}}
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{{viewUrl}}" style="display:inline-block;background:#5542F6;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;">View Document</a>
      </div>
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">If you have questions, please reply to {{senderEmail}}.</p>
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; {{siteName}} — All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "notification",
    name: "General Notification",
    subject: "{{title}} — {{siteName}}",
    description: "Sent for general in-app notifications that also need email delivery.",
    variables: JSON.stringify(["userName", "siteName", "title", "description", "linkUrl", "type"]),
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 32px 28px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">{{siteName}}</h1>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Notification</p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;color:#334155;font-size:15px;">Hello <strong>{{userName}}</strong>,</p>
      <p style="margin:0 0 20px;color:#64748b;font-size:14px;line-height:1.6;">You have a new notification:</p>
      <!-- Notification Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h2 style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:700;">{{title}}</h2>
        <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">{{description}}</p>
      </div>
      {{#if linkUrl}}
      <div style="text-align:center;margin-bottom:24px;">
        <a href="{{linkUrl}}" style="display:inline-block;background:#5542F6;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:10px;font-size:14px;font-weight:600;">View Details</a>
      </div>
      {{/if}}
      <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">This is an automated notification from {{siteName}}.</p>
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; {{siteName}} — All rights reserved.</p>
    </div>
  </div>
</body>
</html>`,
  },
  {
    slug: "invoice-sent",
    name: "Invoice Sent to Client",
    subject: "Invoice {{invoiceNumber}} from {{siteName}}",
    description: "Sent from an invoice with the Send to Client button.",
    variables: JSON.stringify([
      "siteName", "senderName", "senderEmail", "clientName", "invoiceNumber",
      "issueDate", "dueDate", "total", "amountDue", "projectName", "message",
      "itemsHtml", "paymentDetailsHtml", "notes", "terms",
    ]),
    body: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:640px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px;">
      <p style="margin:0;color:#94a3b8;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Invoice</p>
      <h1 style="margin:6px 0 0;color:#ffffff;font-size:24px;font-weight:700;">{{invoiceNumber}}</h1>
      <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;">from {{siteName}}</p>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#334155;font-size:15px;">Hello <strong>{{clientName}}</strong>,</p>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">{{message}}</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#94a3b8;font-size:13px;">Project</td>
          <td style="padding:6px 0;color:#334155;font-size:13px;text-align:right;">{{projectName}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#94a3b8;font-size:13px;">Issue date</td>
          <td style="padding:6px 0;color:#334155;font-size:13px;text-align:right;">{{issueDate}}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#94a3b8;font-size:13px;">Due date</td>
          <td style="padding:6px 0;color:#334155;font-size:13px;text-align:right;">{{dueDate}}</td>
        </tr>
      </table>

      {{itemsHtml}}

      <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount due</p>
        <p style="margin:0;color:#0f172a;font-size:30px;font-weight:800;">{{amountDue}}</p>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:12px;">Invoice total {{total}}</p>
      </div>

      <p style="margin:0 0 24px;color:#64748b;font-size:13px;text-align:center;">
        The full invoice is attached to this email as <strong>{{invoiceNumber}}.pdf</strong>.
      </p>

      {{paymentDetailsHtml}}

      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">{{notes}}</p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">{{terms}}</p>
    </div>

    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">Sent by {{senderName}} &lt;{{senderEmail}}&gt; &middot; &copy; {{siteName}}</p>
    </div>
  </div>
</body>
</html>`,
  },
];

class EmailTemplateService {
  /**
   * Seed default templates if they don't exist yet.
   */
  async seedDefaults() {
    for (const tpl of DEFAULT_TEMPLATES) {
      const existing = await prisma.emailTemplate.findUnique({ where: { slug: tpl.slug } });
      if (!existing) {
        await prisma.emailTemplate.create({ data: tpl });
      }
    }
    // Clear all template caches after seeding
    cache.delByPrefix(CACHE_PREFIX);
  }

  /**
   * List all templates (auto-seeds if empty).
   */
  async listTemplates() {
    const count = await cache.get(CACHE_ALL_COUNT_KEY, async () => {
      return prisma.emailTemplate.count();
    }, CACHE_TTL);

    if (count === 0) await this.seedDefaults();

    return cache.get(CACHE_ALL_KEY, async () => {
      return prisma.emailTemplate.findMany({
        orderBy: { createdAt: "asc" },
      });
    }, CACHE_TTL);
  }

  /**
   * Get a single template by ID.
   */
  async getTemplate(id) {
    const tpl = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!tpl) throw ApiError.notFound("Email template not found");
    return tpl;
  }

  /**
   * Get a template by slug (used internally for sending emails).
   * Cached for 10 minutes — this is the hot path for every email send.
   */
  async getTemplateBySlug(slug) {
    return cache.get(`${CACHE_PREFIX}${slug}`, async () => {
      let tpl = await prisma.emailTemplate.findUnique({ where: { slug } });
      if (!tpl) {
        await this.seedDefaults();
        tpl = await prisma.emailTemplate.findUnique({ where: { slug } });
      }
      if (!tpl) throw ApiError.notFound(`Email template "${slug}" not found`);
      return tpl;
    }, CACHE_TTL);
  }

  /**
   * Update a template (subject + body only).
   * Invalidates the slug-based cache.
   */
  async updateTemplate(id, data) {
    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Email template not found");

    const updated = await prisma.emailTemplate.update({
      where: { id },
      data: {
        subject: data.subject !== undefined ? data.subject : undefined,
        body: data.body !== undefined ? data.body : undefined,
      },
    });

    // Invalidate cache for this template's slug
    cache.del(`${CACHE_PREFIX}${existing.slug}`);
    cache.del(CACHE_ALL_KEY);
    cache.del(CACHE_ALL_COUNT_KEY);

    return updated;
  }

  /**
   * Render a template by replacing {{variables}} with values.
   */
  renderTemplate(template, variables = {}) {
    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(regex, value || "");
      body = body.replace(regex, value || "");
    }

    return { subject, body };
  }
}

export default new EmailTemplateService();
