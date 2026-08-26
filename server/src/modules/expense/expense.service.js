import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import notificationService from "../notification/notification.service.js";
import {
  assertCanApprove, assertCanPay, assertCanView, assertCanEdit,
  canViewAll, isSelfApproving, APPROVER_ROLES,
} from "./expense.permission.js";

const EXPENSE_INCLUDE = {
  category: { select: { id: true, name: true, icon: true, fieldSchema: true, isReimbursable: true } },
  submittedBy: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
  reviewedBy: { select: { id: true, firstName: true, lastName: true } },
  paidBy: { select: { id: true, firstName: true, lastName: true } },
  project: { select: { id: true, name: true } },
  client: { select: { id: true, companyName: true } },
  events: {
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } } },
  },
};

const num = (v) => Number(v || 0);

/**
 * Sequential, human-readable reference: EXP-2026-0001.
 * Scoped per calendar year so numbers stay short.
 */
async function nextReference(tx) {
  const year = new Date().getFullYear();
  const prefix = `EXP-${year}-`;
  const last = await tx.expense.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const seq = last ? parseInt(last.reference.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/**
 * Check a claim's answers against its category's field schema.
 * The schema is admin-authored, so this is the only place it is enforced.
 */
function validateFormData(category, formData, attachments) {
  const fields = Array.isArray(category.fieldSchema) ? category.fieldSchema : [];
  const data = formData || {};
  const missing = [];

  for (const f of fields) {
    if (!f.required) continue;
    const v = data[f.id];
    if (v === undefined || v === null || String(v).trim() === "") missing.push(f.label);
  }
  if (missing.length > 0) {
    throw ApiError.badRequest(`Missing required details: ${missing.join(", ")}`);
  }

  for (const f of fields) {
    const v = data[f.id];
    if (v === undefined || v === null || v === "") continue;
    if (f.type === "number" && Number.isNaN(Number(v))) {
      throw ApiError.badRequest(`${f.label} must be a number`);
    }
    if (f.type === "select" && Array.isArray(f.options) && !f.options.includes(String(v))) {
      throw ApiError.badRequest(`${f.label} must be one of: ${f.options.join(", ")}`);
    }
  }

  if (category.requiresReceipt && (!attachments || attachments.length === 0)) {
    throw ApiError.badRequest(`${category.name} claims need at least one receipt attached`);
  }
}

class ExpenseService {
  // ─── Categories ──────────────────────────────────────

  async listCategories({ includeInactive = false } = {}) {
    return prisma.expenseCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async createCategory(data) {
    return prisma.expenseCategory.create({ data });
  }

  async updateCategory(id, data) {
    const existing = await prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Category not found");
    return prisma.expenseCategory.update({ where: { id }, data });
  }

  /** Categories in use are deactivated, never deleted — history must survive. */
  async removeCategory(id) {
    const used = await prisma.expense.count({ where: { categoryId: id } });
    if (used > 0) {
      return prisma.expenseCategory.update({ where: { id }, data: { isActive: false } });
    }
    await prisma.expenseCategory.delete({ where: { id } });
    return null;
  }

  // ─── Expenses ────────────────────────────────────────

  async create(data, user) {
    const category = await prisma.expenseCategory.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive) throw ApiError.badRequest("Category not found");

    const wantsDraft = data.status === "DRAFT";
    if (!wantsDraft) validateFormData(category, data.formData, data.attachments);

    // Owners and admins record spend directly; everyone else files a claim.
    const status = wantsDraft ? "DRAFT" : isSelfApproving(user) ? "APPROVED" : "PENDING";

    const amount = num(data.amount);
    const taxAmount = num(data.taxAmount);

    const expense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          reference: await nextReference(tx),
          title: data.title,
          description: data.description || null,
          categoryId: category.id,
          formData: data.formData ?? {},
          attachments: data.attachments ?? [],
          amount,
          taxAmount,
          totalAmount: amount + taxAmount,
          expenseDate: new Date(data.expenseDate),
          isReimbursable: data.isReimbursable ?? category.isReimbursable,
          paymentMode: data.paymentMode || null,
          projectId: data.projectId || null,
          clientId: data.clientId || null,
          isBillable: !!data.isBillable,
          status,
          submittedById: user.id,
          // Self-approved spend records its own approval so the trail is complete.
          ...(status === "APPROVED"
            ? { reviewedById: user.id, reviewedAt: new Date() }
            : {}),
        },
      });

      await tx.expenseEvent.create({
        data: {
          expenseId: created.id,
          action: status === "APPROVED" ? "APPROVED" : status === "DRAFT" ? "EDITED" : "SUBMITTED",
          note: status === "APPROVED" ? "Recorded directly" : null,
          statusAfter: status,
          actorId: user.id,
        },
      });

      return tx.expense.findUnique({ where: { id: created.id }, include: EXPENSE_INCLUDE });
    });

    if (status === "PENDING") {
      this.#notifyApprovers(expense).catch((e) =>
        console.error("[ExpenseService] approver notify failed:", e.message)
      );
    }

    return expense;
  }

  async list(filters, user) {
    const {
      page = 1, limit = 20, status, categoryId, projectId, userId,
      isBillable, dateFrom, dateTo, search,
    } = filters;

    const where = {};

    // Anyone who is not an approver or finance only ever sees their own claims.
    if (!canViewAll(user)) where.submittedById = user.id;
    else if (userId) where.submittedById = userId;

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (projectId) where.projectId = projectId;
    if (isBillable !== undefined && isBillable !== "") where.isBillable = isBillable === "true";

    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
      if (dateTo) where.expenseDate.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [expenses, total, sums] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: EXPENSE_INCLUDE,
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { totalAmount: true } }),
    ]);

    return {
      expenses,
      totalAmount: num(sums._sum.totalAmount),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id, user) {
    const expense = await prisma.expense.findUnique({ where: { id }, include: EXPENSE_INCLUDE });
    if (!expense) throw ApiError.notFound("Expense not found");
    assertCanView(user, expense);
    return expense;
  }

  async update(id, data, user) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Expense not found");
    assertCanEdit(user, existing);

    const categoryId = data.categoryId || existing.categoryId;
    const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw ApiError.badRequest("Category not found");

    const patch = {};
    for (const k of [
      "title", "description", "paymentMode", "projectId", "clientId",
      "isBillable", "isReimbursable", "formData", "attachments",
    ]) {
      if (data[k] !== undefined) patch[k] = data[k] === "" ? null : data[k];
    }
    if (data.categoryId !== undefined) patch.categoryId = categoryId;
    if (data.expenseDate !== undefined) patch.expenseDate = new Date(data.expenseDate);

    if (data.amount !== undefined || data.taxAmount !== undefined) {
      const amount = data.amount !== undefined ? num(data.amount) : num(existing.amount);
      const taxAmount = data.taxAmount !== undefined ? num(data.taxAmount) : num(existing.taxAmount);
      patch.amount = amount;
      patch.taxAmount = taxAmount;
      patch.totalAmount = amount + taxAmount;
    }

    // Correcting a rejected claim puts it back in the queue.
    const resubmitting = existing.status === "REJECTED" && data.status !== "DRAFT";
    if (resubmitting) {
      validateFormData(category, patch.formData ?? existing.formData, patch.attachments ?? existing.attachments);
      patch.status = "PENDING";
      patch.reviewedById = null;
      patch.reviewedAt = null;
      patch.reviewNotes = null;
    } else if (data.status === "PENDING" && existing.status === "DRAFT") {
      validateFormData(category, patch.formData ?? existing.formData, patch.attachments ?? existing.attachments);
      patch.status = isSelfApproving(user) ? "APPROVED" : "PENDING";
      if (patch.status === "APPROVED") {
        patch.reviewedById = user.id;
        patch.reviewedAt = new Date();
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.expense.update({ where: { id }, data: patch });
      await tx.expenseEvent.create({
        data: {
          expenseId: id,
          action: patch.status && patch.status !== existing.status ? "SUBMITTED" : "EDITED",
          statusAfter: patch.status || existing.status,
          actorId: user.id,
        },
      });
      return tx.expense.findUnique({ where: { id }, include: EXPENSE_INCLUDE });
    });

    if (updated.status === "PENDING" && existing.status !== "PENDING") {
      this.#notifyApprovers(updated).catch(() => {});
    }

    return updated;
  }

  /** Approve, reject, cancel and pay all funnel through one transition. */
  async #transition(id, { action, statusAfter, note, extra = {} }, user) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Expense not found");

    const updated = await prisma.$transaction(async (tx) => {
      await tx.expense.update({ where: { id }, data: { status: statusAfter, ...extra } });
      await tx.expenseEvent.create({
        data: { expenseId: id, action, note: note || null, statusAfter, actorId: user.id },
      });
      return tx.expense.findUnique({ where: { id }, include: EXPENSE_INCLUDE });
    });

    this.#notifyClaimant(updated, action).catch(() => {});
    return updated;
  }

  async approve(id, note, user) {
    assertCanApprove(user);
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Expense not found");
    if (existing.status !== "PENDING") {
      throw ApiError.badRequest(`Only a pending expense can be approved — this one is ${existing.status}`);
    }
    return this.#transition(id, {
      action: "APPROVED",
      statusAfter: "APPROVED",
      note,
      extra: { reviewedById: user.id, reviewedAt: new Date(), reviewNotes: note || null },
    }, user);
  }

  async reject(id, note, user) {
    assertCanApprove(user);
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Expense not found");
    if (!["PENDING", "APPROVED"].includes(existing.status)) {
      throw ApiError.badRequest(`A ${existing.status} expense cannot be rejected`);
    }
    return this.#transition(id, {
      action: "REJECTED",
      statusAfter: "REJECTED",
      note,
      extra: { reviewedById: user.id, reviewedAt: new Date(), reviewNotes: note },
    }, user);
  }

  async pay(id, { paymentMode, paymentRef, paidAt, note }, user) {
    assertCanPay(user);
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Expense not found");
    if (existing.status !== "APPROVED") {
      throw ApiError.badRequest("Only an approved expense can be marked paid");
    }
    return this.#transition(id, {
      action: "PAID",
      statusAfter: "PAID",
      note,
      extra: {
        paidById: user.id,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        paymentMode: paymentMode || existing.paymentMode,
        paymentRef: paymentRef || null,
      },
    }, user);
  }

  async cancel(id, user) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Expense not found");
    if (existing.submittedById !== user.id && !APPROVER_ROLES.includes(user.role)) {
      throw ApiError.forbidden("Only the claimant can withdraw this expense");
    }
    if (["PAID", "CANCELLED"].includes(existing.status)) {
      throw ApiError.badRequest(`A ${existing.status} expense cannot be withdrawn`);
    }
    return this.#transition(id, { action: "CANCELLED", statusAfter: "CANCELLED" }, user);
  }

  async remove(id, user) {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Expense not found");
    if (user.role !== "OWNER") throw ApiError.forbidden("Only an owner can delete an expense");
    if (existing.status === "PAID") throw ApiError.badRequest("A settled expense cannot be deleted");
    await prisma.expense.delete({ where: { id } });
  }

  // ─── Notifications ───────────────────────────────────

  async #notifyApprovers(expense) {
    const approvers = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { in: APPROVER_ROLES } },
      select: { id: true },
    });
    if (approvers.length === 0) return;

    const who = expense.submittedBy
      ? `${expense.submittedBy.firstName} ${expense.submittedBy.lastName}`
      : "A team member";

    await notificationService.sendBulk({
      userIds: approvers.map((u) => u.id),
      title: `Expense approval needed: ${expense.reference}`,
      description: `${who} submitted "${expense.title}" for ${expense.totalAmount}.`,
      type: "INFO",
      channel: "IN_APP",
    });
  }

  async #notifyClaimant(expense, action) {
    const label = {
      APPROVED: "approved", REJECTED: "rejected",
      PAID: "reimbursed", CANCELLED: "withdrawn",
    }[action];
    if (!label || !expense.submittedById) return;

    await notificationService.sendBulk({
      userIds: [expense.submittedById],
      title: `Expense ${label}: ${expense.reference}`,
      description: `"${expense.title}" was ${label}.${expense.reviewNotes ? ` Note: ${expense.reviewNotes}` : ""}`,
      type: "INFO",
      channel: "IN_APP",
    });
  }
}

export default new ExpenseService();
