import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const FOLLOWUP_INCLUDE = {
  lead: {
    select: { id: true, companyName: true, contactName: true, status: true },
  },
  deal: {
    select: {
      id: true, title: true, stage: true,
      lead: { select: { id: true, companyName: true, contactName: true } },
    },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
};

class FollowUpService {
  /**
   * A follow-up belongs to exactly one parent: a lead being chased, or a deal
   * being worked. Once a lead converts, its chasing moves to the deal.
   */
  async createFollowUp(data, createdById) {
    if (!data.leadId && !data.dealId) {
      throw ApiError.badRequest("A follow-up needs a lead or a deal");
    }
    if (data.leadId && data.dealId) {
      throw ApiError.badRequest("A follow-up belongs to either a lead or a deal, not both");
    }

    if (data.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      if (!lead) throw ApiError.notFound("Lead not found");

      if (lead.status === "CONVERTED") {
        throw ApiError.badRequest("Cannot add follow-ups to a converted lead");
      }
    }

    if (data.dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: data.dealId },
        select: { id: true, stage: true },
      });
      if (!deal) throw ApiError.notFound("Deal not found");

      if (["WON", "LOST"].includes(deal.stage)) {
        throw ApiError.badRequest("Cannot add follow-ups to a closed deal");
      }
    }

    return prisma.followUp.create({
      data: {
        title: data.title,
        type: data.type || "CALL",
        status: data.status || "PENDING",
        dueAt: data.dueAt,
        notes: data.notes || null,
        outcome: data.outcome || null,
        leadId: data.leadId || null,
        dealId: data.dealId || null,
        createdById,
      },
      include: FOLLOWUP_INCLUDE,
    });
  }

  async listFollowUps({ page, limit, type, status, leadId, dealId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;
    if (dealId) where.dealId = dealId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        include: FOLLOWUP_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.followUp.count({ where }),
    ]);

    return {
      followUps,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFollowUpById(id) {
    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: FOLLOWUP_INCLUDE,
    });

    if (!followUp) throw ApiError.notFound("Follow-up not found");
    return followUp;
  }

  async updateFollowUp(id, data) {
    const followUp = await prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw ApiError.notFound("Follow-up not found");

    // Auto-set completedAt when status changes to COMPLETED
    if (data.status === "COMPLETED" && followUp.status !== "COMPLETED") {
      data.completedAt = new Date();
    }

    // Clear completedAt if moving away from COMPLETED
    if (data.status && data.status !== "COMPLETED" && followUp.status === "COMPLETED") {
      data.completedAt = null;
    }

    return prisma.followUp.update({
      where: { id },
      data,
      include: FOLLOWUP_INCLUDE,
    });
  }

  async deleteFollowUp(id) {
    const followUp = await prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throw ApiError.notFound("Follow-up not found");

    await prisma.followUp.delete({ where: { id } });
  }

  async getFollowUpsByLead(leadId) {
    return prisma.followUp.findMany({
      where: { leadId },
      include: FOLLOWUP_INCLUDE,
      orderBy: { dueAt: "asc" },
    });
  }

  async getFollowUpsByDeal(dealId) {
    return prisma.followUp.findMany({
      where: { dealId },
      include: FOLLOWUP_INCLUDE,
      orderBy: { dueAt: "asc" },
    });
  }
}

export default new FollowUpService();
