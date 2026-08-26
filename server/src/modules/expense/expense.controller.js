import expenseService from "./expense.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import { assertCanClaim, canViewAll } from "./expense.permission.js";

class ExpenseController {
  // ─── Categories ──────────────────────────────────────

  listCategories = catchAsync(async (req, res) => {
    // Only admins need to see retired categories.
    const includeInactive = canViewAll(req.user) && req.query.includeInactive === "true";
    const categories = await expenseService.listCategories({ includeInactive });
    return ok(res, "Expense categories retrieved", categories);
  });

  createCategory = catchAsync(async (req, res) => {
    const category = await expenseService.createCategory(req.body);
    return created(res, "Expense category created", category);
  });

  updateCategory = catchAsync(async (req, res) => {
    const category = await expenseService.updateCategory(req.params.id, req.body);
    return ok(res, "Expense category updated", category);
  });

  deleteCategory = catchAsync(async (req, res) => {
    const result = await expenseService.removeCategory(req.params.id);
    return ok(res, result ? "Category deactivated (it has expenses)" : "Category deleted", result);
  });

  // ─── Expenses ────────────────────────────────────────

  create = catchAsync(async (req, res) => {
    assertCanClaim(req.user);
    const expense = await expenseService.create(req.body, req.user);
    return created(res, "Expense recorded", expense);
  });

  list = catchAsync(async (req, res) => {
    const data = await expenseService.list(req.query, req.user);
    return ok(res, "Expenses retrieved", data);
  });

  listMine = catchAsync(async (req, res) => {
    const data = await expenseService.list(
      { ...req.query, userId: req.user.id },
      { ...req.user, role: "EMPLOYEE" } // force own-only scoping
    );
    return ok(res, "My expenses retrieved", data);
  });

  getById = catchAsync(async (req, res) => {
    const expense = await expenseService.getById(req.params.id, req.user);
    return ok(res, "Expense retrieved", expense);
  });

  update = catchAsync(async (req, res) => {
    const expense = await expenseService.update(req.params.id, req.body, req.user);
    return ok(res, "Expense updated", expense);
  });

  approve = catchAsync(async (req, res) => {
    const expense = await expenseService.approve(req.params.id, req.body.note, req.user);
    return ok(res, "Expense approved", expense);
  });

  reject = catchAsync(async (req, res) => {
    const expense = await expenseService.reject(req.params.id, req.body.note, req.user);
    return ok(res, "Expense rejected", expense);
  });

  pay = catchAsync(async (req, res) => {
    const expense = await expenseService.pay(req.params.id, req.body, req.user);
    return ok(res, "Expense marked paid", expense);
  });

  cancel = catchAsync(async (req, res) => {
    const expense = await expenseService.cancel(req.params.id, req.user);
    return ok(res, "Expense withdrawn", expense);
  });

  delete = catchAsync(async (req, res) => {
    await expenseService.remove(req.params.id, req.user);
    return ok(res, "Expense deleted");
  });
}

export default new ExpenseController();
