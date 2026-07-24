import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  listInvoicesSchema,
  getInvoiceSchema,
} from "./invoice.validation.js";
import controller from "./invoice.controller.js";

const router = Router();

router.use(authenticate);

// Invoices — OWNER, SALES_MANAGER, FINANCE_MANAGER (+ ADMIN)
const canManage = authorize("OWNER", "ADMIN", "SALES_MANAGER", "FINANCE_MANAGER");

router.post("/", canManage, validate(createInvoiceSchema), controller.createInvoice);
router.get("/", canManage, validate(listInvoicesSchema), controller.listInvoices);
router.get("/project/:projectId", canManage, controller.getInvoicesByProject);
router.get("/:id", canManage, validate(getInvoiceSchema), controller.getInvoice);
router.patch("/:id", canManage, validate(updateInvoiceSchema), controller.updateInvoice);
router.delete("/:id", canManage, validate(getInvoiceSchema), controller.deleteInvoice);

export default router;
