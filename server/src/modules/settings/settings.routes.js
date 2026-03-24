import { Router } from "express";
import settingsController from "./settings.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { updateSettingsSchema } from "./settings.validation.js";

const router = Router();

// All settings routes are OWNER-only
router.use(authenticate);
router.use(authorize("OWNER"));

router.get("/", settingsController.getSettings);
router.patch("/", validate(updateSettingsSchema), settingsController.updateSettings);

export default router;
