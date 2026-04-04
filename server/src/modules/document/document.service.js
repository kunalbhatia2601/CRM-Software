import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import { sendMail } from "../../utils/mailer.js";
import emailTemplateService from "../email-template/email-template.service.js";


const DOCUMENT_INCLUDE = {
  deal: {
    select: { id: true, title: true, stage: true },
  },
  client: {
    select: { id: true, companyName: true, contactName: true, email: true },
  },
  project: {
    select: { id: true, name: true, status: true },
  },
  addedBy: {
    select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
  },
};

class DocumentService {
  /**
   * Create a new document.
   */
  async createDocument(data, addedById) {
    // Auto-compute version: count existing docs of same type for same deal/client/project
    const versionWhere = { type: data.type || "PROPOSAL" };
    if (data.dealId) versionWhere.dealId = data.dealId;
    if (data.clientId) versionWhere.clientId = data.clientId;

    const existingCount = await prisma.document.count({ where: versionWhere });
    const version = existingCount + 1;

    const document = await prisma.document.create({
      data: {
        name: data.name,
        type: data.type || "PROPOSAL",
        version,
        fileUrl: data.fileUrl,
        fileKey: data.fileKey || null,
        mimeType: data.mimeType || null,
        fileSize: data.fileSize || null,
        description: data.description || null,
        isAiGenerated: data.isAiGenerated || false,
        dealId: data.dealId || null,
        clientId: data.clientId || null,
        projectId: data.projectId || null,
        addedById,
      },
      include: DOCUMENT_INCLUDE,
    });

    return document;
  }

  /**
   * List documents with pagination, filters, search.
   */
  async listDocuments({ page, limit, type, dealId, clientId, projectId, search, sortBy, sortOrder }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (type) where.type = type;
    if (dealId) where.dealId = dealId;
    if (clientId) where.clientId = clientId;
    if (projectId) where.projectId = projectId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: DOCUMENT_INCLUDE,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.document.count({ where }),
    ]);

    return {
      documents,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single document by ID.
   */
  async getDocumentById(id) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: DOCUMENT_INCLUDE,
    });

    if (!document) throw ApiError.notFound("Document not found");
    return document;
  }

  /**
   * Update document metadata.
   */
  async updateDocument(id, data) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw ApiError.notFound("Document not found");

    return prisma.document.update({
      where: { id },
      data,
      include: DOCUMENT_INCLUDE,
    });
  }

  /**
   * Delete a document.
   */
  async deleteDocument(id) {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) throw ApiError.notFound("Document not found");

    await prisma.document.delete({ where: { id } });
  }

  /**
   * Get documents for a specific deal.
   */
  async getDocumentsByDeal(dealId) {
    return prisma.document.findMany({
      where: { dealId },
      include: DOCUMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get documents for a specific project.
   */
  async getDocumentsByProject(projectId) {
    return prisma.document.findMany({
      where: { projectId },
      include: DOCUMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Send a document via email using the "document-shared" email template.
   */
  async sendDocumentEmail(id, { to, cc, subject, message }) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        deal: { select: { title: true } },
        addedBy: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    if (!document) throw ApiError.notFound("Document not found");

    const siteName = await this.#getSiteName();
    const senderName = `${document.addedBy.firstName} ${document.addedBy.lastName}`;

    // Get the template from email templates (editable via Settings)
    const template = await emailTemplateService.getTemplateBySlug("document-shared");

    const variables = {
      siteName,
      senderName,
      senderEmail: document.addedBy.email,
      documentName: document.name,
      documentType: document.type,
      documentVersion: String(document.version),
      dealTitle: document.deal?.title || "N/A",
      message: message || "",
      viewUrl: document.fileUrl,
    };

    const rendered = emailTemplateService.renderTemplate(template, variables);

    // Allow subject override; otherwise use the template-rendered subject
    const finalSubject = subject || rendered.subject;

    await sendMail({
      to,
      cc,
      subject: finalSubject,
      html: rendered.body,
    });

    return { sent: true, to, cc };
  }

  async #getSiteName() {
    try {
      const site = await prisma.site.findUnique({ where: { id: "default" } });
      return site?.name || "TaskGo Agency";
    } catch {
      return "TaskGo Agency";
    }
  }
}

export default new DocumentService();
