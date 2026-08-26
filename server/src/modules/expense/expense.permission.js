import { ApiError } from "../../utils/apiError.js";

/**
 * Expense permissions.
 *
 * Approval is a spending decision (OWNER/ADMIN); payment is an execution one
 * (+ FINANCE_MANAGER). Deliberately split, the same way payroll is.
 */

export const APPROVER_ROLES = ["OWNER", "ADMIN"];
export const PAYER_ROLES = ["OWNER", "ADMIN", "FINANCE_MANAGER"];
export const VIEW_ALL_ROLES = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

/** Everyone on staff may claim; clients never see expenses at all. */
export function canClaim(user) {
  return !!user && user.role !== "CLIENT";
}

export function canApprove(user) {
  return APPROVER_ROLES.includes(user?.role);
}

export function canPay(user) {
  return PAYER_ROLES.includes(user?.role);
}

export function canViewAll(user) {
  return VIEW_ALL_ROLES.includes(user?.role);
}

/** OWNER/ADMIN spend is recorded directly rather than claimed. */
export function isSelfApproving(user) {
  return APPROVER_ROLES.includes(user?.role);
}

export function canViewExpense(user, expense) {
  if (canViewAll(user)) return true;
  return expense.submittedById === user?.id;
}

/**
 * The claimant may correct a claim until it is decided. Once approved or paid
 * it is a financial record, so only an approver may touch it.
 */
export function canEditExpense(user, expense) {
  const isOwnClaim = expense.submittedById === user?.id;
  const editableByClaimant = ["DRAFT", "PENDING", "REJECTED"].includes(expense.status);
  if (isOwnClaim && editableByClaimant) return true;
  return canApprove(user) && expense.status !== "PAID";
}

export function assertCanClaim(user) {
  if (!canClaim(user)) throw ApiError.forbidden("Clients cannot record expenses");
}

export function assertCanApprove(user) {
  if (!canApprove(user)) throw ApiError.forbidden("Only an owner or admin can approve expenses");
}

export function assertCanPay(user) {
  if (!canPay(user)) throw ApiError.forbidden("Only an owner, admin or finance manager can settle expenses");
}

export function assertCanView(user, expense) {
  if (!canViewExpense(user, expense)) throw ApiError.forbidden("You cannot view this expense");
}

export function assertCanEdit(user, expense) {
  if (!canEditExpense(user, expense)) {
    throw ApiError.forbidden("This expense can no longer be edited");
  }
}
