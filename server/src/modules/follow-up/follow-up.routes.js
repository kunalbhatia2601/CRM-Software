import { Router } from "express";
import followUpController from "./follow-up.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createFollowUpSchema,
  updateFollowUpSchema,
  listFollowUpsSchema,
  getFollowUpSchema,
  deleteFollowUpSchema,
} from "./follow-up.validation.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", validate(listFollowUpsSchema), followUpController.list);
router.get("/lead/:leadId", followUpController.getByLead);
router.get("/deal/:dealId", followUpController.getByDeal);
router.get("/:id", validate(getFollowUpSchema), followUpController.getById);

router.post(
  "/",
  authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"),
  validate(createFollowUpSchema),
  followUpController.create
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"),
  validate(updateFollowUpSchema),
  followUpController.update
);

router.delete(
  "/:id",
  authorize("OWNER", "ADMIN"),
  validate(deleteFollowUpSchema),
  followUpController.delete
);

export default router;
