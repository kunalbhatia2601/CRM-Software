import prisma from "../../utils/prisma.js";

class SiteService {
  /**
   * Get site info (public — no auth needed)
   * Auto-creates default record if none exists
   */
  async getSiteInfo() {
    let site = await prisma.site.findUnique({ where: { id: "default" } });

    if (!site) {
      site = await prisma.site.create({ data: { id: "default" } });
    }

    // Strip timestamps for public response
    const { createdAt, updatedAt, ...publicData } = site;
    return publicData;
  }

  /**
   * Update site configuration (OWNER only)
   */
  async updateSiteInfo(data) {
    let site = await prisma.site.findUnique({ where: { id: "default" } });

    if (!site) {
      site = await prisma.site.create({ data: { id: "default", ...data } });
    } else {
      site = await prisma.site.update({
        where: { id: "default" },
        data,
      });
    }

    const { createdAt, updatedAt, ...publicData } = site;
    return publicData;
  }
}

export default new SiteService();
