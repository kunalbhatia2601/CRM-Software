import documentService from "./document.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import prisma from "../../utils/prisma.js";
import { getUserProjectIds } from "../../utils/projectPermission.js";

class DocumentController {
  create = catchAsync(async (req, res) => {
    const document = await documentService.createDocument(req.body, req.user.id);
    return created(res, "Document created successfully", document);
  });

  list = catchAsync(async (req, res) => {
    const query = { ...req.query };

    // CLIENT users only see documents from their own projects
    if (req.user.role === "CLIENT") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { clientId: true },
      });
      if (user?.clientId) {
        query.clientId = user.clientId;
      }
    }

    // EMPLOYEE users only see documents from their team's projects
    if (req.user.role === "EMPLOYEE") {
      const pIds = await getUserProjectIds(req.user.id);
      if (pIds.length > 0) {
        query.projectIds = pIds;
      }
    }

    // ACCOUNT_MANAGER only sees documents from their managed projects
    if (req.user.role === "ACCOUNT_MANAGER") {
      const projects = await prisma.project.findMany({
        where: { accountManagerId: req.user.id },
        select: { id: true },
      });
      query.projectIds = projects.map((p) => p.id);
    }

    const result = await documentService.listDocuments(query);
    return ok(res, "Documents retrieved", result);
  });

  getById = catchAsync(async (req, res) => {
    const document = await documentService.getDocumentById(req.params.id);
    return ok(res, "Document retrieved", document);
  });

  update = catchAsync(async (req, res) => {
    const document = await documentService.updateDocument(req.params.id, req.body);
    return ok(res, "Document updated successfully", document);
  });

  delete = catchAsync(async (req, res) => {
    await documentService.deleteDocument(req.params.id);
    return ok(res, "Document deleted successfully");
  });

  getByDeal = catchAsync(async (req, res) => {
    const documents = await documentService.getDocumentsByDeal(req.params.dealId);
    return ok(res, "Documents retrieved", documents);
  });

  getByProject = catchAsync(async (req, res) => {
    const documents = await documentService.getDocumentsByProject(req.params.projectId);
    return ok(res, "Documents retrieved", documents);
  });

  getByUser = catchAsync(async (req, res) => {
    const documents = await documentService.getDocumentsByUser(req.params.userId);
    return ok(res, "Documents retrieved", documents);
  });

  sendEmail = catchAsync(async (req, res) => {
    const result = await documentService.sendDocumentEmail(req.params.id, req.body);
    return ok(res, "Document email sent successfully", result);
  });
}

export default new DocumentController();
