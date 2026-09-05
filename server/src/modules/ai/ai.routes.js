import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import aiController from "./ai.controller.js";
import { generateSchema, searchSchema, listModelsSchema } from "./ai.validation.js";

const router = Router();

router.use(authenticate);

// Generic AI generation (OWNER/ADMIN only for now)
router.post(
  "/generate",
  authorize("OWNER", "ADMIN"),
  validate(generateSchema),
  aiController.generate
);

// Live model catalogue for the AI settings screen (OWNER/ADMIN).
// POST because it may carry an unsaved API key, which has no place in a URL.
router.post(
  "/models",
  authorize("OWNER", "ADMIN"),
  validate(listModelsSchema),
  aiController.listModels
);

// CRM Search Assistant (OWNER/ADMIN)
router.post(
  "/search",
  authorize("OWNER", "ADMIN"),
  validate(searchSchema),
  aiController.searchAndAnswer
);

export default router;
