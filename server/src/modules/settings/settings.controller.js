import settingsService from "./settings.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class SettingsController {
  /**
   * GET /api/settings
   * Protected — OWNER only. Returns system settings.
   */
  getSettings = catchAsync(async (_req, res) => {
    const settings = await settingsService.getSettings();
    return ok(res, "Settings retrieved", settings);
  });

  /**
   * PATCH /api/settings
   * Protected — OWNER only. Updates system settings.
   */
  updateSettings = catchAsync(async (req, res) => {
    const settings = await settingsService.updateSettings(req.body);
    return ok(res, "Settings updated successfully", settings);
  });
}

export default new SettingsController();
