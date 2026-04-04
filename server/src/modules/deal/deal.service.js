import bcrypt from "bcryptjs";
import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import config from "../../config/index.js";
import sampleService from "../sample/sample.service.js";
import notificationService from "../notification/notification.service.js";

const STAGE_TRANSITIONS = {
  DISCOVERY: ["PROPOSAL", "LOST"],
  PROPOSAL: ["NEGOTIATION", "LOST"],
  NEGOTIATION: ["WON", "LOST"],
  WON: [],    // terminal
  LOST: ["DISCOVERY"], // allow re-opening
};

const DEAL_INCLUDE = {
  lead: {
    select: { id: true, companyName: true, contactName: true, email: true, phone: true, source: true },
  },
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true, role: true },
  },
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  client: {
    select: { id: true, companyName: true, status: true },
  },
  project: {
    select: { id: true, name: true, status: true },
  },
  dealServices: {
    include: {
      service: {
        select: { id: true, name: true, price: true, salePrice: true, points: true, isActive: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  documents: {
    select: {
      id: true,
      name: true,
      type: true,
      version: true,
      fileUrl: true,
      isAiGenerated: true,
      createdAt: true,
      addedBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  },
};

class DealService {
  /**
   * Create deal from a qualified lead
   */
  async createDeal(data, createdById) {
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });

    if (!lead) {
      throw ApiError.notFound("Lead not found");
    }

    if (lead.status !== "QUALIFIED") {
      throw ApiError.badRequest("Only qualified leads can be converted to deals");
    }

    // Check if lead already has a deal
    const existingDeal = await prisma.deal.findUnique({ where: { leadId: data.leadId } });
    if (existingDeal) {
      throw ApiError.conflict("This lead already has a deal");
    }

    // Validate assignee
    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!assignee) throw ApiError.badRequest("Assigned user not found");
      if (!["OWNER", "ADMIN", "SALES_MANAGER"].includes(assignee.role)) {
        throw ApiError.badRequest("Deals can only be assigned to Owner, Admin, or Sales Manager");
      }
    }

    // Create deal + mark lead as CONVERTED in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: data.leadId },
        data: { status: "CONVERTED", convertedAt: new Date() },
      });

      const newDeal = await tx.deal.create({
        data: {
          title: data.title,
          value: data.value,
          expectedCloseAt: data.expectedCloseAt,
          notes: data.notes,
          leadId: data.leadId,
          assigneeId: data.assigneeId || lead.assigneeId,
          createdById,
        },
        include: DEAL_INCLUDE,
      });

      // Copy samples from lead to the new deal
      await sampleService.copySamplesFromLeadToDeal(data.leadId, newDeal.id, tx);

      return newDeal;
    });

    return deal;
  }

  /**
   * List deals with pagination, filters, search, sort
   */
  async listDeals({ page, limit, stage, assigneeId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (stage) where.stage = stage;
    if (assigneeId) where.assigneeId = assigneeId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { lead: { companyName: { contains: search, mode: "insensitive" } } },
        { lead: { contactName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: DEAL_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      deals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single deal
   */
  async getDealById(id) {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: DEAL_INCLUDE,
    });

    if (!deal) throw ApiError.notFound("Deal not found");
    return deal;
  }

  /**
   * Update deal details (not stage)
   */
  async updateDeal(id, data) {
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) throw ApiError.notFound("Deal not found");

    if (deal.stage === "WON") {
      throw ApiError.badRequest("Cannot edit a won deal");
    }

    if (data.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!assignee) throw ApiError.badRequest("Assigned user not found");
      if (!["OWNER", "ADMIN", "SALES_MANAGER"].includes(assignee.role)) {
        throw ApiError.badRequest("Deals can only be assigned to Owner, Admin, or Sales Manager");
      }
    }

    return prisma.deal.update({
      where: { id },
      data,
      include: DEAL_INCLUDE,
    });
  }

  /**
   * Update deal stage with transition validation
   * WON triggers: auto-create Client + Project with user-provided config
   */
  async updateDealStage(id, stage, { lostReason, accountManagerId, projectConfig, documents } = {}) {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { lead: true, dealServices: true },
    });

    if (!deal) throw ApiError.notFound("Deal not found");

    const allowed = STAGE_TRANSITIONS[deal.stage];
    if (!allowed.includes(stage)) {
      throw ApiError.badRequest(
        `Cannot transition from '${deal.stage}' to '${stage}'. Allowed: ${allowed.join(", ") || "none (terminal)"}`
      );
    }

    if (stage === "LOST" && !lostReason) {
      throw ApiError.badRequest("Lost reason is required when marking a deal as lost");
    }

    // ── WON: create Client + Project with user-provided configuration ──
    if (stage === "WON") {
      // Validate account manager if provided
      if (accountManagerId) {
        const am = await prisma.user.findUnique({ where: { id: accountManagerId } });
        if (!am) throw ApiError.badRequest("Account manager not found");
        if (!["OWNER", "ADMIN", "ACCOUNT_MANAGER"].includes(am.role)) {
          throw ApiError.badRequest("Account manager must have Owner, Admin, or Account Manager role");
        }
      }

      // projectConfig can override: name, description, budget, startDate, endDate,
      // billingCycle, nextBillingDate, notes, services (with custom prices)
      const cfg = projectConfig || {};

      const result = await prisma.$transaction(async (tx) => {
        // Check if client already exists with this email
        let client = null;
        let isExistingClient = false;
        if (deal.lead.email) {
          client = await tx.client.findUnique({ where: { email: deal.lead.email } });
          if (client) isExistingClient = true;
        }

        // Create client if doesn't exist
        if (!client) {
          client = await tx.client.create({
            data: {
              companyName: deal.lead.companyName,
              contactName: deal.lead.contactName,
              email: deal.lead.email,
              phone: deal.lead.phone,
              dealId: deal.id,
              accountManagerId: accountManagerId || null,
            },
          });
        }

        // Auto-create CLIENT-role user if one doesn't already exist
        let clientUser = null;
        if (deal.lead.email) {
          const existingUser = await tx.user.findUnique({
            where: { email: deal.lead.email },
          });

          if (existingUser) {
            if (!existingUser.clientId && existingUser.role === "CLIENT") {
              await tx.user.update({
                where: { id: existingUser.id },
                data: { clientId: client.id },
              });
            }
            clientUser = existingUser;
          } else {
            const defaultPassword = `${deal.lead.companyName.replace(/\s+/g, "")}@123`;
            const hashedPassword = await bcrypt.hash(defaultPassword, config.bcrypt.saltRounds);

            const nameParts = deal.lead.contactName.trim().split(/\s+/);
            const firstName = nameParts[0] || "Client";
            const lastName = nameParts.slice(1).join(" ") || deal.lead.companyName;

            clientUser = await tx.user.create({
              data: {
                email: deal.lead.email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: deal.lead.phone || null,
                role: "CLIENT",
                status: "ACTIVE",
                clientId: client.id,
              },
            });
          }
        }

        // Determine if project should start in DUE_SIGNING status
        const docs = documents || [];
        const hasSignatureRequired = docs.some((d) => d.requiresSignature);

        // Create project with user-provided config
        const project = await tx.project.create({
          data: {
            name: cfg.name || deal.title,
            description: cfg.description || null,
            status: hasSignatureRequired ? "DUE_SIGNING" : "NOT_STARTED",
            clientId: client.id,
            dealId: deal.id,
            accountManagerId: accountManagerId || null,
            createdById: deal.createdById,
            budget: cfg.budget != null ? cfg.budget : deal.value,
            startDate: cfg.startDate ? new Date(cfg.startDate) : null,
            endDate: cfg.endDate ? new Date(cfg.endDate) : null,
            billingCycle: cfg.billingCycle || "ONE_TIME",
            nextBillingDate: cfg.nextBillingDate ? new Date(cfg.nextBillingDate) : null,
            notes: cfg.notes || null,
          },
        });

        // Copy services — use custom prices from cfg.services if provided, else deal service prices
        const servicesConfig = cfg.services; // [{ serviceId, price, originalPrice, quantity }]
        const dealServicesData = deal.dealServices;

        if (servicesConfig && servicesConfig.length > 0) {
          // User provided custom service config from convert page
          await tx.projectService.createMany({
            data: servicesConfig.map((s) => ({
              projectId: project.id,
              serviceId: s.serviceId,
              quantity: s.quantity || 1,
              price: s.price,
              originalPrice: s.originalPrice,
            })),
          });
        } else if (dealServicesData.length > 0) {
          // Fallback: copy deal services as-is
          await tx.projectService.createMany({
            data: dealServicesData.map((ds) => ({
              projectId: project.id,
              serviceId: ds.serviceId,
              quantity: ds.quantity,
              price: ds.price,
              originalPrice: ds.originalPrice,
            })),
          });
        }

        // Create conversion documents (Agreements, NDAs, etc.) linked to project + client
        let createdDocuments = [];
        if (docs.length > 0) {
          createdDocuments = await Promise.all(
            docs.map((doc) =>
              tx.document.create({
                data: {
                  name: doc.name,
                  type: doc.type || "AGREEMENT",
                  fileUrl: doc.fileUrl,
                  fileKey: doc.fileKey || null,
                  mimeType: doc.mimeType || null,
                  fileSize: doc.fileSize || null,
                  description: doc.description || null,
                  isAiGenerated: doc.isAiGenerated || false,
                  requiresSignature: doc.requiresSignature || false,
                  projectId: project.id,
                  clientId: client.id,
                  dealId: deal.id,
                  addedById: deal.createdById,
                },
              })
            )
          );
        }

        const owners = await tx.user.findMany({ where: { role: "OWNER" } });
        await notificationService.sendBulk({
            userIds: owners.map((owner) => owner.id),
            title: "Deal Won",
            description: `Deal "${deal.title}" won successfully`,
            type: "INFO",
            channel: "IN_APP",
            linkUrl: `/owner/deals/${deal.id}`
          });

        // Update deal
        const updatedDeal = await tx.deal.update({
          where: { id },
          data: { stage: "WON", wonAt: new Date() },
          include: DEAL_INCLUDE,
        });

        return {
          deal: updatedDeal,
          client,
          project,
          documents: createdDocuments,
          clientUser: clientUser ? { id: clientUser.id, email: clientUser.email } : null,
          isExistingClient,
        };
      });

      return result;
    }

    // ── LOST or stage change ──
    const updateData = { stage };
    if (stage === "LOST") updateData.lostReason = lostReason;
    if (stage === "DISCOVERY" && deal.stage === "LOST") updateData.lostReason = null;

    const updated = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: DEAL_INCLUDE,
    });

    return { deal: updated };
  }

  /**
   * Add services to a deal — stores both snapshot price and original price
   */
  async addServicesToDeal(dealId, services) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw ApiError.notFound("Deal not found");

    if (deal.stage === "WON") {
      throw ApiError.badRequest("Cannot modify services on a won deal");
    }

    const results = [];
    for (const item of services) {
      const service = await prisma.service.findUnique({ where: { id: item.serviceId } });
      if (!service) throw ApiError.badRequest(`Service ${item.serviceId} not found`);

      // Original price = service's current effective price (salePrice or price)
      const originalPrice = service.salePrice ?? service.price;
      // Snapshot price = user-provided custom price, or the original price
      const price = item.price ?? originalPrice;

      const dealService = await prisma.dealService.upsert({
        where: { dealId_serviceId: { dealId, serviceId: item.serviceId } },
        create: {
          dealId,
          serviceId: item.serviceId,
          quantity: item.quantity || 1,
          price,
          originalPrice,
        },
        update: {
          quantity: item.quantity || 1,
          price,
          originalPrice,
        },
        include: {
          service: {
            select: { id: true, name: true, price: true, salePrice: true, points: true, isActive: true },
          },
        },
      });
      results.push(dealService);
    }

    return results;
  }

  /**
   * Remove a service from a deal
   */
  async removeServiceFromDeal(dealId, serviceId) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw ApiError.notFound("Deal not found");

    if (deal.stage === "WON") {
      throw ApiError.badRequest("Cannot modify services on a won deal");
    }

    const existing = await prisma.dealService.findUnique({
      where: { dealId_serviceId: { dealId, serviceId } },
    });
    if (!existing) throw ApiError.notFound("Service not linked to this deal");

    await prisma.dealService.delete({
      where: { dealId_serviceId: { dealId, serviceId } },
    });
  }

  /**
   * Delete a deal (only DISCOVERY or LOST)
   */
  async deleteDeal(id) {
    const deal = await prisma.deal.findUnique({ where: { id } });
    if (!deal) throw ApiError.notFound("Deal not found");

    if (!["DISCOVERY", "LOST"].includes(deal.stage)) {
      throw ApiError.badRequest("Only deals in DISCOVERY or LOST stage can be deleted");
    }

    // Revert lead status back to QUALIFIED
    await prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: deal.leadId },
        data: { status: "QUALIFIED", convertedAt: null },
      });
      await tx.deal.delete({ where: { id } });
    });
  }
}

export default new DealService();
