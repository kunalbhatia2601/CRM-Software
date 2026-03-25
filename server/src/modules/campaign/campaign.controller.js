import metaService from "./meta.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok } from "../../utils/apiResponse.js";

class CampaignController {
  /**
   * GET /api/campaigns/overview
   * Account-level overview with aggregate insights.
   */
  getOverview = catchAsync(async (req, res) => {
    const { datePreset } = req.query;
    const data = await metaService.getAccountOverview(datePreset);
    return ok(res, "Account overview retrieved", data);
  });

  /**
   * GET /api/campaigns/test-connection
   * Test Meta API connection.
   */
  testConnection = catchAsync(async (req, res) => {
    const data = await metaService.testConnection();
    return ok(res, "Connection test complete", data);
  });

  /**
   * GET /api/campaigns
   * List all campaigns from Meta.
   */
  listCampaigns = catchAsync(async (req, res) => {
    const { limit, after, status } = req.query;
    const data = await metaService.listCampaigns({ limit, after, status });
    return ok(res, "Campaigns retrieved", data);
  });

  /**
   * GET /api/campaigns/:id
   * Get single campaign with insights + ad sets.
   */
  getCampaign = catchAsync(async (req, res) => {
    const data = await metaService.getCampaign(req.params.id);
    return ok(res, "Campaign retrieved", data);
  });

  /**
   * GET /api/campaigns/:id/insights
   * Get campaign performance insights.
   */
  getCampaignInsights = catchAsync(async (req, res) => {
    const { datePreset } = req.query;
    const data = await metaService.getCampaignInsights(req.params.id, datePreset);
    return ok(res, "Campaign insights retrieved", data);
  });

  /**
   * GET /api/campaigns/:id/insights/daily
   * Get daily breakdown for charts.
   */
  getCampaignDailyInsights = catchAsync(async (req, res) => {
    const { datePreset } = req.query;
    const data = await metaService.getCampaignDailyInsights(req.params.id, datePreset);
    return ok(res, "Daily insights retrieved", data);
  });

  /**
   * GET /api/campaigns/:id/adsets
   * Get ad sets for a campaign.
   */
  getCampaignAdSets = catchAsync(async (req, res) => {
    const data = await metaService.getCampaignAdSets(req.params.id);
    return ok(res, "Ad sets retrieved", data);
  });

  /**
   * GET /api/campaigns/:id/ads
   * Get ads for a campaign.
   */
  getCampaignAds = catchAsync(async (req, res) => {
    const data = await metaService.getCampaignAds(req.params.id);
    return ok(res, "Ads retrieved", data);
  });

  /**
   * PATCH /api/campaigns/:id/status
   * Update campaign status (ACTIVE, PAUSED, ARCHIVED).
   */
  updateCampaignStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    await metaService.updateCampaignStatus(req.params.id, status);
    return ok(res, `Campaign status updated to ${status}`);
  });

  /**
   * GET /api/campaigns/lead-forms
   * Get lead forms from the connected Facebook Page.
   */
  getLeadForms = catchAsync(async (req, res) => {
    const data = await metaService.getLeadForms();
    return ok(res, "Lead forms retrieved", data);
  });

  /**
   * GET /api/campaigns/lead-forms/:formId/leads
   * Get leads from a specific lead form.
   */
  getLeadFormData = catchAsync(async (req, res) => {
    const { limit, after } = req.query;
    const data = await metaService.getLeadFormData(req.params.formId, { limit, after });
    return ok(res, "Lead form data retrieved", data);
  });
}

export default new CampaignController();
