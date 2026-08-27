import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

/**
 * Fields a client actually needs to pay. Snapshotted onto an invoice so a later
 * edit to the account cannot change what an already-sent invoice says.
 */
export function snapshotOf(account) {
  if (!account) return null;
  if (account.type === "BANK") {
    return {
      type: "BANK",
      label: account.label,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      accountHolderName: account.accountHolderName,
      branch: account.branch || null,
    };
  }
  return {
    type: "UPI",
    label: account.label,
    upiId: account.upiId,
    upiName: account.upiName,
  };
}

/** Re-check a merged record — a partial edit must still leave it payable. */
function assertComplete(account) {
  if (account.type === "BANK") {
    const missing = [
      ["bankName", "Bank name"],
      ["accountNumber", "Account number"],
      ["ifscCode", "IFSC code"],
      ["accountHolderName", "Account holder name"],
    ].filter(([f]) => !account[f]?.trim()).map(([, l]) => l);
    if (missing.length) throw ApiError.badRequest(`Missing for a bank account: ${missing.join(", ")}`);
  } else {
    if (!account.upiId?.trim()) throw ApiError.badRequest("UPI ID is required");
    if (!account.upiName?.trim()) throw ApiError.badRequest("Name is required for a UPI account");
  }
}

/** Only one account can be the default. */
async function clearOtherDefaults(tx, keepId) {
  await tx.paymentAccount.updateMany({
    where: { isDefault: true, ...(keepId ? { id: { not: keepId } } : {}) },
    data: { isDefault: false },
  });
}

class PaymentAccountService {
  async list({ includeInactive = false } = {}) {
    return prisma.paymentAccount.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { label: "asc" }],
    });
  }

  async getById(id) {
    const account = await prisma.paymentAccount.findUnique({ where: { id } });
    if (!account) throw ApiError.notFound("Payment account not found");
    return account;
  }

  async create(data) {
    // Type decides which half of the record is meaningful; blank the other so
    // a bank account never carries a stale UPI id.
    const clean =
      data.type === "BANK"
        ? { ...data, upiId: null, upiName: null }
        : { ...data, bankName: null, accountNumber: null, ifscCode: null, accountHolderName: null, branch: null };

    return prisma.$transaction(async (tx) => {
      const created = await tx.paymentAccount.create({ data: clean });
      if (created.isDefault) await clearOtherDefaults(tx, created.id);
      return tx.paymentAccount.findUnique({ where: { id: created.id } });
    });
  }

  async update(id, data) {
    const existing = await this.getById(id);
    const merged = { ...existing, ...data };
    assertComplete(merged);

    const clean =
      merged.type === "BANK"
        ? { ...data, upiId: null, upiName: null }
        : { ...data, bankName: null, accountNumber: null, ifscCode: null, accountHolderName: null, branch: null };

    return prisma.$transaction(async (tx) => {
      const updated = await tx.paymentAccount.update({ where: { id }, data: clean });
      if (updated.isDefault) await clearOtherDefaults(tx, id);
      return tx.paymentAccount.findUnique({ where: { id } });
    });
  }

  /**
   * Accounts already used on an invoice are deactivated, never deleted — the
   * invoice keeps its own snapshot, but the link is still worth preserving.
   */
  async remove(id) {
    const used = await prisma.invoice.count({ where: { paymentAccountId: id } });
    if (used > 0) {
      return prisma.paymentAccount.update({ where: { id }, data: { isActive: false, isDefault: false } });
    }
    await prisma.paymentAccount.delete({ where: { id } });
    return null;
  }
}

export default new PaymentAccountService();
