import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createDeliverableSchema,
  updateDeliverableSchema,
  projectParamSchema,
  idParamSchema,
  addFeedbackSchema,
} from "./deliverable.validation.js";
import controller from "./deliverable.controller.js";

const router = Router();

router.use(authenticate);

// Who can create/edit deliverables
const canManage = authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER", "SALES_MANAGER", "EMPLOYEE");
// Who can read (clients are scoped to published + their own project in the service)
const canRead = authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER", "SALES_MANAGER", "EMPLOYEE", "CLIENT");

router.post("/", canManage, validate(createDeliverableSchema), controller.createDeliverable);
router.get("/project/:projectId", canRead, validate(projectParamSchema), controller.listByProject);
router.get("/:id", canRead, validate(idParamSchema), controller.getDeliverable);
router.patch("/:id", canManage, validate(updateDeliverableSchema), controller.updateDeliverable);
router.delete("/:id", authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER"), validate(idParamSchema), controller.deleteDeliverable);

// Feedback — clients review, staff can also comment
router.post("/:id/feedback", canRead, validate(addFeedbackSchema), controller.addFeedback);

export default router;
