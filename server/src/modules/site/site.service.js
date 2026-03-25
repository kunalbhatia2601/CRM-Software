import prisma from "../../utils/prisma.js";
import cache from "../../utils/cache.js";

const CACHE_KEY = "site";
const CACHE_TTL = 600; // 10 minutes

class SiteService {
  /**
   * Get site info (public — no auth needed)
   * Auto-creates default record if none exists.
   * Cached for 10 minutes.
   */
  async getSiteInfo() {
    const site = await cache.get(CACHE_KEY, async () => {
      let record = await prisma.site.findUnique({ where: { id: "default" } });
      if (!record) {
        record = await prisma.site.create({ data: { id: "default" } });
      }
      return record;
    }, CACHE_TTL);

    // Strip timestamps for public response
    const { createdAt, updatedAt, ...publicData } = site;
    return publicData;
  }

  /**
   * Update site configuration (OWNER only)
   * Invalidates cache after update.
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

    // Invalidate cache so next read gets fresh data
    cache.del(CACHE_KEY);

    const { createdAt, updatedAt, ...publicData } = site;
    return publicData;
  }
}

export default new SiteService();
