import { Router } from "express";
import milestoneController from "./milestone.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  getMilestoneSchema,
  deleteMilestoneSchema,
  reorderMilestonesSchema,
} from "./milestone.validation.js";

const router = Router();

router.use(authenticate);

// Named routes first
router.get("/project/:projectId", milestoneController.getByProject);
router.patch("/project/:projectId/reorder", validate(reorderMilestonesSchema), milestoneController.reorder);

router.post("/", validate(createMilestoneSchema), milestoneController.create);
router.get("/:id", validate(getMilestoneSchema), milestoneController.getById);
router.patch("/:id", validate(updateMilestoneSchema), milestoneController.update);
router.delete("/:id", validate(deleteMilestoneSchema), milestoneController.delete);

export default router;
