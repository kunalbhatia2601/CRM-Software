import { Router } from "express";
import siteController from "./site.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { updateSiteSchema } from "./site.validation.js";

const router = Router();

// Public route — no auth required
router.get("/", siteController.getSiteInfo);

// Protected — OWNER only
router.patch(
  "/",
  authenticate,
  authorize("OWNER"),
  validate(updateSiteSchema),
  siteController.updateSiteInfo
);

export default router;
