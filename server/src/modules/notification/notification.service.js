import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { sendMail } from "../../utils/mailer.js";
import emailTemplateService from "../email-template/email-template.service.js";

const USER_ROLES = [
  "OWNER",
  "ADMIN",
  "SALES_MANAGER",
  "ACCOUNT_MANAGER",
  "FINANCE_MANAGER",
  "MARKETING_MANAGER",
  "HR",
  "EMPLOYEE",
  "CLIENT"
];

class NotificationService {
  /**
   * The main callable function — creates a notification and optionally sends email.
   *
   * @param {Object} opts
   * @param {string}  opts.userId      — Recipient user ID
   * @param {string}  opts.title       — Notification title
   * @param {string}  opts.description — Notification body
   * @param {string}  [opts.type]      — NotificationType enum (INFO, SUCCESS, WARNING, ERROR, LEAD, DEAL, etc.)
   * @param {string}  [opts.channel]   — IN_APP | EMAIL | BOTH (default: IN_APP)
   * @param {string}  [opts.linkUrl]   — Optional deep-link URL within the app
   * @returns {Promise<Object>} Created notification record
   */
  async send({
    userId,
    title,
    description,
    type = "INFO",
    channel = "IN_APP",
    linkUrl = null,
  }) {

    linkUrl = linkUrl && linkUrl?.trim();

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!user) throw ApiError.notFound("User not found");

    // Determine what to do
    const shouldSaveNotification = channel === "IN_APP" || channel === "BOTH";
    const shouldSendEmail = channel === "EMAIL" || channel === "BOTH";

    let notification = null;
    let emailSent = false;

    let link = (linkUrl == null || linkUrl?.trim() == "" || linkUrl == undefined) ? "/" : linkUrl;

    // CHeck if link is like ROLE/.... and ROLE is in (USER_ROLE) then replace ROLE by rolic
    const parts = link.split("/");
    console.log("Link URL: ", link);
    console.log("Parts: ", parts);
    if(parts.length > 1 && USER_ROLES.includes(parts[1].toUpperCase())) {
      parts[1] = "rolic";
      link = parts.join("/");
    }

    // 1. Save in-app notification
    if (shouldSaveNotification) {
      notification = await prisma.notification.create({
        data: {
          title,
          description,
          type,
          channel,
          linkUrl: link,
          userId,
          emailSent: false,
        },
      });
    }

    // 2. Send email (non-blocking — don't fail the notification if email fails)
    if (shouldSendEmail) {
      try {
        const template = await emailTemplateService.getTemplateBySlug("notification");
        const siteSafe = await this.#getSiteName();

        const { subject, body } = emailTemplateService.renderTemplate(template, {
          siteName: siteSafe,
          userName: `${user.firstName} ${user.lastName}`,
          title,
          description,
          linkUrl: linkUrl || "",
          type,
        });

        await sendMail({
          to: user.email,
          subject,
          html: body,
        });

        emailSent = true;

        // Mark email sent on the notification record
        if (notification) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          });
        }
      } catch (err) {
        console.error("[NotificationService] Email send failed:", err.message);
        // Email failure should not block the notification creation
      }
    }

    // If channel is EMAIL only and no notification was saved, create a record anyway for audit
    if (!notification) {
      notification = await prisma.notification.create({
        data: {
          title,
          description,
          type,
          channel,
          linkUrl,
          userId,
          emailSent,
        },
      });
    }

    return notification;
  }

  /**
   * Send notification to multiple users at once.
   */
  async sendBulk({ userIds, title, description, type = "INFO", channel = "IN_APP", linkUrl = null }) {
    const results = [];
    for (const userId of userIds) {
      try {
        const notification = await this.send({ userId, title, description, type, channel, linkUrl });
        results.push(notification);
      } catch (err) {
        console.error(`[NotificationService] Failed for user ${userId}:`, err.message);
      }
    }
    return results;
  }

  /**
   * List notifications for a user (paginated).
   */
  async listNotifications({ userId, page = 1, limit = 20, unreadOnly = false }) {
    const skip = (page - 1) * limit;
    const where = { userId };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread count for header badge.
   */
  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw ApiError.notFound("Notification not found");

    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  /**
   * Delete a single notification.
   */
  async deleteNotification(id, userId) {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw ApiError.notFound("Notification not found");

    return prisma.notification.delete({ where: { id } });
  }

  /**
   * Delete all read notifications for a user (cleanup).
   */
  async clearRead(userId) {
    const result = await prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
    return { deleted: result.count };
  }

  async #getSiteName() {
    try {
      const site = await prisma.site.findUnique({ where: { id: "default" } });
      return site?.name || "TaskGo Agency";
    } catch {
      return "TaskGo Agency";
    }
  }
}

export default new NotificationService();
