import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";

const SAMPLE_INCLUDE = {
  createdBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  leadSamples: {
    include: {
      lead: {
        select: { id: true, companyName: true, contactName: true, status: true },
      },
    },
  },
  dealSamples: {
    include: {
      deal: {
        select: { id: true, title: true, stage: true, value: true },
      },
    },
  },
};

class SampleService {
  /**
   * Create a new sample
   */
  async createSample(data, createdById) {
    const sample = await prisma.sample.create({
      data: {
        name: data.name,
        description: data.description || null,
        links: data.links,
        createdById,
      },
      include: SAMPLE_INCLUDE,
    });
    return sample;
  }

  /**
   * List samples with pagination, search, sort
   */
  async listSamples({ page, limit, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [samples, total] = await Promise.all([
      prisma.sample.findMany({
        where,
        include: SAMPLE_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.sample.count({ where }),
    ]);

    return {
      samples,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single sample by ID
   */
  async getSampleById(id) {
    const sample = await prisma.sample.findUnique({
      where: { id },
      include: SAMPLE_INCLUDE,
    });
    if (!sample) throw ApiError.notFound("Sample not found");
    return sample;
  }

  /**
   * Update sample details
   */
  async updateSample(id, data) {
    const sample = await prisma.sample.findUnique({ where: { id } });
    if (!sample) throw ApiError.notFound("Sample not found");

    return prisma.sample.update({
      where: { id },
      data,
      include: SAMPLE_INCLUDE,
    });
  }

  /**
   * Delete a sample
   */
  async deleteSample(id) {
    const sample = await prisma.sample.findUnique({ where: { id } });
    if (!sample) throw ApiError.notFound("Sample not found");
    await prisma.sample.delete({ where: { id } });
  }

  /**
   * Get all samples (for dropdown)
   */
  async getSamplesDropdown() {
    return prisma.sample.findMany({
      select: { id: true, name: true, description: true, links: true },
      orderBy: { name: "asc" },
    });
  }

  // ─── Lead ↔ Sample ────────────────────────────────────

  /**
   * Attach samples to a lead
   */
  async attachSamplesToLead(leadId, sampleIds) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw ApiError.notFound("Lead not found");

    // Validate all sample IDs exist
    const samples = await prisma.sample.findMany({
      where: { id: { in: sampleIds } },
      select: { id: true },
    });
    if (samples.length !== sampleIds.length) {
      throw ApiError.badRequest("One or more sample IDs are invalid");
    }

    // Upsert to avoid duplicate errors
    const results = [];
    for (const sampleId of sampleIds) {
      const ls = await prisma.leadSample.upsert({
        where: { leadId_sampleId: { leadId, sampleId } },
        create: { leadId, sampleId },
        update: {},
        include: {
          sample: { include: SAMPLE_INCLUDE },
        },
      });
      results.push(ls);
    }

    return results;
  }

  /**
   * Detach a sample from a lead
   */
  async detachSampleFromLead(leadId, sampleId) {
    const existing = await prisma.leadSample.findUnique({
      where: { leadId_sampleId: { leadId, sampleId } },
    });
    if (!existing) throw ApiError.notFound("Sample not linked to this lead");

    await prisma.leadSample.delete({
      where: { leadId_sampleId: { leadId, sampleId } },
    });
  }

  /**
   * Get samples attached to a lead
   */
  async getSamplesByLead(leadId) {
    const items = await prisma.leadSample.findMany({
      where: { leadId },
      include: {
        sample: { include: SAMPLE_INCLUDE },
      },
      orderBy: { createdAt: "desc" },
    });
    return items.map((ls) => ls.sample);
  }

  // ─── Deal ↔ Sample ────────────────────────────────────

  /**
   * Attach samples to a deal
   */
  async attachSamplesToDeal(dealId, sampleIds) {
    const deal = await prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw ApiError.notFound("Deal not found");

    const samples = await prisma.sample.findMany({
      where: { id: { in: sampleIds } },
      select: { id: true },
    });
    if (samples.length !== sampleIds.length) {
      throw ApiError.badRequest("One or more sample IDs are invalid");
    }

    const results = [];
    for (const sampleId of sampleIds) {
      const ds = await prisma.dealSample.upsert({
        where: { dealId_sampleId: { dealId, sampleId } },
        create: { dealId, sampleId },
        update: {},
        include: {
          sample: { include: SAMPLE_INCLUDE },
        },
      });
      results.push(ds);
    }

    return results;
  }

  /**
   * Detach a sample from a deal
   */
  async detachSampleFromDeal(dealId, sampleId) {
    const existing = await prisma.dealSample.findUnique({
      where: { dealId_sampleId: { dealId, sampleId } },
    });
    if (!existing) throw ApiError.notFound("Sample not linked to this deal");

    await prisma.dealSample.delete({
      where: { dealId_sampleId: { dealId, sampleId } },
    });
  }

  /**
   * Get samples attached to a deal
   */
  async getSamplesByDeal(dealId) {
    const items = await prisma.dealSample.findMany({
      where: { dealId },
      include: {
        sample: { include: SAMPLE_INCLUDE },
      },
      orderBy: { createdAt: "desc" },
    });
    return items.map((ds) => ds.sample);
  }

  /**
   * Copy all samples from a lead to a deal (used during conversion)
   */
  async copySamplesFromLeadToDeal(leadId, dealId, tx = prisma) {
    const leadSamples = await tx.leadSample.findMany({
      where: { leadId },
      select: { sampleId: true },
    });

    if (leadSamples.length === 0) return;

    await tx.dealSample.createMany({
      data: leadSamples.map((ls) => ({
        dealId,
        sampleId: ls.sampleId,
      })),
      skipDuplicates: true,
    });
  }
}

export default new SampleService();
