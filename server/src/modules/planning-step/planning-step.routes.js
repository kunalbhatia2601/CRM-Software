import { Router } from "express";
import planningStepController from "./planning-step.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createStepSchema,
  updateStepSchema,
  getStepSchema,
  deleteStepSchema,
  reorderStepsSchema,
} from "./planning-step.validation.js";

const router = Router();

router.use(authenticate);

// Named routes first
router.get("/project/:projectId", planningStepController.getByProject);
router.patch("/project/:projectId/reorder", validate(reorderStepsSchema), planningStepController.reorder);

router.post("/", validate(createStepSchema), planningStepController.create);
router.get("/:id", validate(getStepSchema), planningStepController.getById);
router.patch("/:id", validate(updateStepSchema), planningStepController.update);
router.delete("/:id", validate(deleteStepSchema), planningStepController.delete);

export default router;
