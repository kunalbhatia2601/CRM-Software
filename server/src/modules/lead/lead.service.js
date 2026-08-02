import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

// Valid status transitions
const STATUS_TRANSITIONS = {
  NEW: ["CONTACTED", "QUALIFIED", "UNQUALIFIED", "LOST"],
  CONTACTED: ["QUALIFIED", "UNQUALIFIED", "LOST"],
  QUALIFIED: ["CONVERTED", "LOST"],
  UNQUALIFIED: ["NEW", "CONTACTED", "LOST"], // allow re-qualification
  CONVERTED: [], // terminal
  LOST: ["NEW"], // allow re-opening
};

const LEAD_INCLUDE = {
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
};

class LeadService {
  /**
   * Create a new lead
   */
  async createLead(data, createdById) {
    // Duplicate check: same email + company
    if (data.email) {
      const duplicate = await prisma.lead.findFirst({
        where: {
          email: data.email,
          companyName: data.companyName,
          status: { notIn: ["LOST"] },
        },
      });
      if (duplicate) {
        throw ApiError.conflict(
          `A lead with email '${data.email}' from '${data.companyName}' already exists`
        );
      }
    }

    // Validate assignee exists and has appropriate role
    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assigneeId },
      });
      if (!assignee) {
        throw ApiError.badRequest("Assigned user not found");
      }
      if (assignee.role === "CLIENT") {
        throw ApiError.badRequest("Leads cannot be assigned to a client");
      }
    }

    const lead = await prisma.lead.create({
      data: {
        ...data,
        createdById,
      },
      include: LEAD_INCLUDE,
    });

    return lead;
  }

  /**
   * List leads with pagination, filters, search, sort
   */
  async listLeads({ page, limit, status, source, priority, assigneeId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (source) where.source = source;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: LEAD_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single lead by ID
   */
  async getLeadById(id) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: LEAD_INCLUDE,
    });

    if (!lead) {
      throw ApiError.notFound("Lead not found");
    }

    return lead;
  }

  /**
   * Update lead details (not status — use updateStatus for that)
   */
  async updateLead(id, data) {
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      throw ApiError.notFound("Lead not found");
    }

    if (lead.status === "CONVERTED") {
      throw ApiError.badRequest("Cannot edit a converted lead");
    }

    // Validate assignee if being changed
    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: data.assigneeId },
      });
      if (!assignee) {
        throw ApiError.badRequest("Assigned user not found");
      }
      if (assignee.role === "CLIENT") {
        throw ApiError.badRequest("Leads cannot be assigned to a client");
      }
    }

    // Duplicate check if email/company changing
    if (data.email || data.companyName) {
      const checkEmail = data.email || lead.email;
      const checkCompany = data.companyName || lead.companyName;

      if (checkEmail) {
        const duplicate = await prisma.lead.findFirst({
          where: {
            email: checkEmail,
            companyName: checkCompany,
            status: { notIn: ["LOST"] },
            id: { not: id },
          },
        });
        if (duplicate) {
          throw ApiError.conflict(
            `A lead with email '${checkEmail}' from '${checkCompany}' already exists`
          );
        }
      }
    }

    const updated = await prisma.lead.update({
      where: { id },
      data,
      include: LEAD_INCLUDE,
    });

    return updated;
  }

  /**
   * Update lead status with transition validation
   */
  async updateLeadStatus(id, status, lostReason) {
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      throw ApiError.notFound("Lead not found");
    }

    const allowed = STATUS_TRANSITIONS[lead.status];
    if (!allowed.includes(status)) {
      throw ApiError.badRequest(
        `Cannot transition from '${lead.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none (terminal state)"}`
      );
    }

    if (status === "LOST" && !lostReason) {
      throw ApiError.badRequest("Lost reason is required when marking a lead as lost");
    }

    const updateData = { status };

    if (status === "LOST") {
      updateData.lostReason = lostReason;
    }

    if (status === "CONVERTED") {
      updateData.convertedAt = new Date();
    }

    // Clear lost reason if re-opening
    if (status === "NEW" && lead.status === "LOST") {
      updateData.lostReason = null;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: LEAD_INCLUDE,
    });

    return updated;
  }

  /**
   * Delete a lead (only if NEW or LOST)
   */
  async deleteLead(id) {
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      throw ApiError.notFound("Lead not found");
    }

    if (!["NEW", "LOST"].includes(lead.status)) {
      throw ApiError.badRequest(
        "Only leads with status NEW or LOST can be deleted"
      );
    }

    await prisma.lead.delete({ where: { id } });
  }
}

export default new LeadService();
