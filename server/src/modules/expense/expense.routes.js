import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import controller from "./expense.controller.js";
import {
  createCategorySchema, updateCategorySchema,
  createExpenseSchema, updateExpenseSchema, listExpensesSchema,
  idParamSchema, reviewSchema, rejectSchema, paySchema,
} from "./expense.validation.js";

const router = Router();

router.use(authenticate);

// Clients have no business in the expense system at all.
const staff = authorize(
  "OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER",
  "FINANCE_MANAGER", "MARKETING_MANAGER", "HR", "EMPLOYEE"
);
const adminOnly = authorize("OWNER", "ADMIN");

// ─── Categories ───
router.get("/categories", staff, controller.listCategories);
router.post("/categories", adminOnly, validate(createCategorySchema), controller.createCategory);
router.patch("/categories/:id", adminOnly, validate(updateCategorySchema), controller.updateCategory);
router.delete("/categories/:id", adminOnly, validate(idParamSchema), controller.deleteCategory);

// ─── Expenses ───
// Named routes before /:id so they are not swallowed by it.
router.get("/my", staff, validate(listExpensesSchema), controller.listMine);
router.get("/stats", staff, controller.stats);

// Project spend — company financials, so the money roles only.
router.get(
  "/project/:projectId/summary",
  authorize("OWNER", "ADMIN", "FINANCE_MANAGER"),
  controller.projectSummary
);

router.post("/", staff, validate(createExpenseSchema), controller.create);
router.get("/", staff, validate(listExpensesSchema), controller.list);
router.get("/:id", staff, validate(idParamSchema), controller.getById);
router.patch("/:id", staff, validate(updateExpenseSchema), controller.update);
router.delete("/:id", authorize("OWNER"), validate(idParamSchema), controller.delete);

// Transitions — service enforces who may do what.
router.post("/:id/approve", staff, validate(reviewSchema), controller.approve);
router.post("/:id/reject", staff, validate(rejectSchema), controller.reject);
router.post("/:id/pay", staff, validate(paySchema), controller.pay);
router.post("/:id/cancel", staff, validate(idParamSchema), controller.cancel);

export default router;
