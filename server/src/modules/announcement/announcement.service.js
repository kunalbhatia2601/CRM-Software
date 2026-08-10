import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import notificationService from "../notification/notification.service.js";

const INCLUDE = {
  createdBy: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
};

// Map announcement audience → prisma user where-clause.
function audienceWhere(audience) {
  const base = { status: "ACTIVE" };
  switch (audience) {
    case "EMPLOYEES":
      return { ...base, role: "EMPLOYEE" };
    case "MANAGERS":
      return { ...base, role: { in: ["SALES_MANAGER", "ACCOUNT_MANAGER", "FINANCE_MANAGER"] } };
    case "HR":
      return { ...base, role: "HR" };
    case "ALL":
    default:
      return { ...base, role: { not: "CLIENT" } };
  }
}

class AnnouncementService {
  async create(data, createdById) {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        audience: data.audience || "ALL",
        isPinned: !!data.isPinned,
        createdById,
      },
      include: INCLUDE,
    });

    // Fan out to recipients as in-app notifications (fire-and-forget).
    this.#broadcast(announcement).catch((err) =>
      console.error("[AnnouncementService] broadcast failed:", err.message)
    );

    return announcement;
  }

  async #broadcast(announcement) {
    const recipients = await prisma.user.findMany({
      where: audienceWhere(announcement.audience),
      select: { id: true },
    });
    if (recipients.length === 0) return;

    await notificationService.sendBulk({
      userIds: recipients.map((u) => u.id),
      title: `📢 ${announcement.title}`,
      description: announcement.body.slice(0, 300),
      type: "SYSTEM",
      channel: "IN_APP",
    });
  }

  async list({ page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        include: INCLUDE,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.announcement.count(),
    ]);
    return { announcements, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async remove(id) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Announcement not found");
    await prisma.announcement.delete({ where: { id } });
  }
}

export default new AnnouncementService();
