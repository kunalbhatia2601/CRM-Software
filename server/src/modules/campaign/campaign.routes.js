import { Router } from "express";
import campaignController from "./campaign.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  listCampaignsSchema,
  getCampaignSchema,
  campaignInsightsSchema,
  updateCampaignStatusSchema,
  getLeadFormDataSchema,
  overviewSchema,
} from "./campaign.validation.js";

const router = Router();

// All campaign routes require auth
router.use(authenticate);

// Owner + Admin can access campaigns
const campaignAccess = authorize("OWNER", "ADMIN");

// ─── Account-level ──────────────────────────────────────
router.get("/overview", campaignAccess, validate(overviewSchema), campaignController.getOverview);
router.get("/test-connection", campaignAccess, campaignController.testConnection);

// ─── Lead Forms ─────────────────────────────────────────
router.get("/lead-forms", campaignAccess, campaignController.getLeadForms);
router.get(
  "/lead-forms/:formId/leads",
  campaignAccess,
  validate(getLeadFormDataSchema),
  campaignController.getLeadFormData
);

// ─── Campaign CRUD ──────────────────────────────────────
router.get("/", campaignAccess, validate(listCampaignsSchema), campaignController.listCampaigns);
router.get("/:id", campaignAccess, validate(getCampaignSchema), campaignController.getCampaign);
router.get(
  "/:id/insights",
  campaignAccess,
  validate(campaignInsightsSchema),
  campaignController.getCampaignInsights
);
router.get(
  "/:id/insights/daily",
  campaignAccess,
  validate(campaignInsightsSchema),
  campaignController.getCampaignDailyInsights
);
router.get("/:id/adsets", campaignAccess, validate(getCampaignSchema), campaignController.getCampaignAdSets);
router.get("/:id/ads", campaignAccess, validate(getCampaignSchema), campaignController.getCampaignAds);

// ─── Campaign Actions ───────────────────────────────────
router.patch(
  "/:id/status",
  authorize("OWNER"),
  validate(updateCampaignStatusSchema),
  campaignController.updateCampaignStatus
);

export default router;
