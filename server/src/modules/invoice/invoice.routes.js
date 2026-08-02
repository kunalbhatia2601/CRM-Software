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

// Manage — OWNER, SALES_MANAGER, FINANCE_MANAGER (+ ADMIN)
const canManage = authorize("OWNER", "ADMIN", "SALES_MANAGER", "FINANCE_MANAGER");
// Read — managers + CLIENT (CLIENT is scoped to their own client in the service)
const canRead = authorize("OWNER", "ADMIN", "SALES_MANAGER", "FINANCE_MANAGER", "CLIENT");

router.post("/", canManage, validate(createInvoiceSchema), controller.createInvoice);
router.get("/", canManage, validate(listInvoicesSchema), controller.listInvoices);
// Client portal — invoices for the logged-in client's own company
router.get("/my", authorize("CLIENT"), controller.listMyInvoices);
router.get("/project/:projectId", canRead, controller.getInvoicesByProject);
router.get("/:id", canRead, validate(getInvoiceSchema), controller.getInvoice);
router.patch("/:id", canManage, validate(updateInvoiceSchema), controller.updateInvoice);
router.delete("/:id", canManage, validate(getInvoiceSchema), controller.deleteInvoice);

export default router;
