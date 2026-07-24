import { Router } from "express";
import settingsController from "./settings.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { updateSettingsSchema } from "./settings.validation.js";

const router = Router();

router.use(authenticate);

router.get("/ai", settingsController.getAiSettings);
router.get("/invoice-config", settingsController.getInvoiceConfig);
router.get("/", authorize("OWNER"), settingsController.getSettings);
router.patch("/", authorize("OWNER"), validate(updateSettingsSchema), settingsController.updateSettings);

export default router;
