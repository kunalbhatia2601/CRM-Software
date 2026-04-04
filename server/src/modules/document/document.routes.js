import { Router } from "express";
import documentController from "./document.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createDocumentSchema,
  updateDocumentSchema,
  listDocumentsSchema,
  getDocumentSchema,
  deleteDocumentSchema,
  sendDocumentEmailSchema,
} from "./document.validation.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", validate(listDocumentsSchema), documentController.list);
router.get("/deal/:dealId", documentController.getByDeal);
router.get("/project/:projectId", documentController.getByProject);
router.get("/:id", validate(getDocumentSchema), documentController.getById);

router.post(
  "/",
  authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"),
  validate(createDocumentSchema),
  documentController.create
);

router.patch(
  "/:id",
  authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"),
  validate(updateDocumentSchema),
  documentController.update
);

router.delete(
  "/:id",
  authorize("OWNER", "ADMIN"),
  validate(deleteDocumentSchema),
  documentController.delete
);

router.post(
  "/:id/send-email",
  authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"),
  validate(sendDocumentEmailSchema),
  documentController.sendEmail
);

export default router;
