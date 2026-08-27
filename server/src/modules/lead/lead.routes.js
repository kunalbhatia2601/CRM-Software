import { Router } from "express";
import leadController from "./lead.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createLeadSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
  listLeadsSchema,
  getLeadSchema,
} from "./lead.validation.js";

const router = Router();

// All lead routes require auth
router.use(authenticate);

// Owner + Admin + Sales Manager can access leads
const leadAccess = authorize("OWNER", "ADMIN", "SALES_MANAGER", "MARKETING_MANAGER");

router.post("/", leadAccess, validate(createLeadSchema), leadController.createLead);
router.get("/", leadAccess, validate(listLeadsSchema), leadController.listLeads);
router.get("/:id", leadAccess, validate(getLeadSchema), leadController.getLeadById);
router.patch("/:id", leadAccess, validate(updateLeadSchema), leadController.updateLead);
router.patch("/:id/status", leadAccess, validate(updateLeadStatusSchema), leadController.updateLeadStatus);
router.delete("/:id", authorize("OWNER"), validate(getLeadSchema), leadController.deleteLead);

export default router;
