import siteService from "./site.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class SiteController {
  /**
   * GET /api/site
   * Public — returns site name, logo, contact, currency, mode flags
   */
  getSiteInfo = catchAsync(async (_req, res) => {
    const site = await siteService.getSiteInfo();
    return ok(res, "Site info retrieved", site);
  });

  /**
   * PATCH /api/site
   * Protected — OWNER only. Updates site configuration.
   */
  updateSiteInfo = catchAsync(async (req, res) => {
    const site = await siteService.updateSiteInfo(req.body);
    return ok(res, "Site settings updated successfully", site);
  });
}

export default new SiteController();
