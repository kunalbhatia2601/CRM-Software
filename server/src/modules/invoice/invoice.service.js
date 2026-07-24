import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import notificationService from "../notification/notification.service.js";

const INVOICE_INCLUDE = {
  items: { orderBy: { position: "asc" } },
  project: {
    select: { id: true, name: true, status: true },
  },
  client: {
    select: { id: true, companyName: true, contactName: true, email: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
};

/**
 * Round to 2 decimals (money).
 */
function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/**
 * Compute money totals from raw line items + discount + tax.
 */
function computeTotals(items, discountAmount = 0, taxPercent = 0) {
  const lineItems = items.map((it, idx) => {
    const quantity = round2(it.quantity ?? 1);
    const unitPrice = round2(it.unitPrice ?? 0);
    const amount = round2(quantity * unitPrice);
    return {
      name: it.name,
      description: it.description || null,
      quantity,
      unitPrice,
      amount,
      position: idx,
    };
  });

  const subtotal = round2(lineItems.reduce((sum, it) => sum + it.amount, 0));
  const discount = round2(discountAmount);
  const taxableBase = Math.max(0, subtotal - discount);
  const taxPct = round2(taxPercent);
  const taxAmount = round2((taxableBase * taxPct) / 100);
  const total = round2(taxableBase + taxAmount);

  return { lineItems, subtotal, discount, taxPct, taxAmount, total };
}

class InvoiceService {
  /**
   * Generate the next sequential invoice number for the current year.
   * Format: INV-<year>-<0001>
   */
  async #nextInvoiceNumber() {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const last = await prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });

    let seq = 1;
    if (last) {
      const n = parseInt(last.invoiceNumber.slice(prefix.length), 10);
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefix}${String(seq).padStart(4, "0")}`;
  }

  async createInvoice(data, createdById) {
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: { client: true },
    });
    if (!project) throw ApiError.notFound("Project not found");

    const { lineItems, subtotal, discount, taxPct, taxAmount, total } = computeTotals(
      data.items,
      data.discountAmount,
      data.taxPercent
    );

    const invoiceNumber = await this.#nextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: data.status || "DRAFT",
        currency: data.currency || "INR",
        projectId: project.id,
        clientId: project.clientId || null,
        billToName: data.billToName ?? project.client?.companyName ?? null,
        billToEmail: data.billToEmail || project.client?.email || null,
        billToAddress: data.billToAddress ?? project.client?.address ?? null,
        subtotal,
        discountAmount: discount,
        taxPercent: taxPct,
        taxAmount,
        total,
        amountPaid: 0,
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || null,
        terms: data.terms || null,
        createdById,
        items: { create: lineItems },
      },
      include: INVOICE_INCLUDE,
    });

    // Notify the client's portal users (in-app) — fire-and-forget.
    this.#notifyClientOfInvoice(invoice, project).catch((err) =>
      console.error("[InvoiceService] client notify failed:", err.message)
    );

    return invoice;
  }

  /**
   * In-app notification to CLIENT-role users linked to the invoice's client.
   */
  async #notifyClientOfInvoice(invoice, project) {
    if (!project.clientId) return;

    const portalUsers = await prisma.user.findMany({
      where: { clientId: project.clientId, role: "CLIENT", status: "ACTIVE" },
      select: { id: true },
    });
    if (portalUsers.length === 0) return;

    await notificationService.sendBulk({
      userIds: portalUsers.map((u) => u.id),
      title: `New invoice ${invoice.invoiceNumber}`,
      description: `An invoice for project "${project.name}" is now available to view.`,
      type: "INFO",
      channel: "IN_APP",
      linkUrl: `/client/projects/${project.id}`,
    });
  }

  async listInvoices(filters = {}) {
    const { page = 1, limit = 10, status, projectId, clientId, search } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (clientId) where.clientId = clientId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { billToName: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: INVOICE_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getInvoiceById(id, user = null) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw ApiError.notFound("Invoice not found");

    // CLIENT users may only view finalized invoices for their own client.
    if (user?.role === "CLIENT") {
      if (!user.clientId || invoice.clientId !== user.clientId || invoice.status === "DRAFT") {
        throw ApiError.notFound("Invoice not found");
      }
    }
    return invoice;
  }

  async getInvoicesByProject(projectId, user = null) {
    const where = { projectId };

    // CLIENT users: restrict to their own client + hide drafts.
    if (user?.role === "CLIENT") {
      if (!user.clientId) return [];
      where.clientId = user.clientId;
      where.status = { not: "DRAFT" };
    }

    return prisma.invoice.findMany({
      where,
      include: INVOICE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  async updateInvoice(id, data) {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Invoice not found");

    const updateData = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.billToName !== undefined) updateData.billToName = data.billToName;
    if (data.billToEmail !== undefined) updateData.billToEmail = data.billToEmail || null;
    if (data.billToAddress !== undefined) updateData.billToAddress = data.billToAddress;
    if (data.issueDate !== undefined) updateData.issueDate = data.issueDate ? new Date(data.issueDate) : existing.issueDate;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.terms !== undefined) updateData.terms = data.terms;

    // If line items / discount / tax change → recompute totals + replace items
    const discountAmount = data.discountAmount !== undefined ? data.discountAmount : Number(existing.discountAmount);
    const taxPercent = data.taxPercent !== undefined ? data.taxPercent : Number(existing.taxPercent);

    if (data.items !== undefined) {
      const { lineItems, subtotal, discount, taxPct, taxAmount, total } = computeTotals(
        data.items,
        discountAmount,
        taxPercent
      );
      updateData.subtotal = subtotal;
      updateData.discountAmount = discount;
      updateData.taxPercent = taxPct;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      // Replace items atomically
      updateData.items = { deleteMany: {}, create: lineItems };
    } else if (data.discountAmount !== undefined || data.taxPercent !== undefined) {
      // Recompute money from existing items
      const items = await prisma.invoiceItem.findMany({ where: { invoiceId: id }, orderBy: { position: "asc" } });
      const { subtotal, discount, taxPct, taxAmount, total } = computeTotals(
        items.map((i) => ({ name: i.name, description: i.description, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
        discountAmount,
        taxPercent
      );
      updateData.subtotal = subtotal;
      updateData.discountAmount = discount;
      updateData.taxPercent = taxPct;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    }

    // amountPaid + auto-status
    if (data.amountPaid !== undefined) {
      updateData.amountPaid = round2(data.amountPaid);
      const totalNow = updateData.total ?? Number(existing.total);
      if (updateData.amountPaid >= totalNow && totalNow > 0) {
        updateData.status = "PAID";
        updateData.paidAt = new Date();
      } else if (updateData.amountPaid > 0) {
        updateData.status = data.status || "PARTIALLY_PAID";
      }
    }

    return prisma.invoice.update({
      where: { id },
      data: updateData,
      include: INVOICE_INCLUDE,
    });
  }

  async deleteInvoice(id) {
    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("Invoice not found");
    await prisma.invoice.delete({ where: { id } });
  }
}

export default new InvoiceService();
