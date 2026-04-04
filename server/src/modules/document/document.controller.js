import documentService from "./document.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class DocumentController {
  create = catchAsync(async (req, res) => {
    const document = await documentService.createDocument(req.body, req.user.id);
    return created(res, "Document created successfully", document);
  });

  list = catchAsync(async (req, res) => {
    const result = await documentService.listDocuments(req.query);
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

  sendEmail = catchAsync(async (req, res) => {
    const result = await documentService.sendDocumentEmail(req.params.id, req.body);
    return ok(res, "Document email sent successfully", result);
  });
}

export default new DocumentController();
