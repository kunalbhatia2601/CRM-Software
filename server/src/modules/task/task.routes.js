import { Router } from "express";
import taskController from "./task.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  deleteTaskSchema,
  bulkUpdateStatusSchema,
  addFeedbackSchema,
} from "./task.validation.js";

const router = Router();

router.use(authenticate);

// Named routes first
router.get("/project/:projectId", taskController.getByProject);
router.get("/project/:projectId/assignable-users", taskController.getAssignableUsers);
router.patch("/bulk-status", validate(bulkUpdateStatusSchema), taskController.bulkUpdateStatus);

router.post("/", validate(createTaskSchema), taskController.create);
router.get("/:id", validate(getTaskSchema), taskController.getById);
router.patch("/:id", validate(updateTaskSchema), taskController.update);
router.delete("/:id", validate(deleteTaskSchema), taskController.delete);
router.get("/:id/children", validate(getTaskSchema), taskController.getChildTasks);
router.post("/:id/feedback", validate(addFeedbackSchema), taskController.addFeedback);

export default router;
