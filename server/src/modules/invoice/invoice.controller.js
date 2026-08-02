import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import invoiceService from "./invoice.service.js";

const createInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body, req.user.id);
  return created(res, "Invoice created successfully", invoice);
});

const listInvoices = catchAsync(async (req, res) => {
  const result = await invoiceService.listInvoices(req.query);
  return ok(res, "Invoices retrieved", result);
});

const getInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
  return ok(res, "Invoice retrieved", invoice);
});

const listMyInvoices = catchAsync(async (req, res) => {
  const result = await invoiceService.listMyInvoices(req.user);
  return ok(res, "My invoices", result);
});

const getInvoicesByProject = catchAsync(async (req, res) => {
  const invoices = await invoiceService.getInvoicesByProject(req.params.projectId, req.user);
  return ok(res, "Project invoices retrieved", invoices);
});

const updateInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
  return ok(res, "Invoice updated successfully", invoice);
});

const deleteInvoice = catchAsync(async (req, res) => {
  await invoiceService.deleteInvoice(req.params.id);
  return ok(res, "Invoice deleted successfully");
});

export default {
  createInvoice,
  listInvoices,
  getInvoice,
  listMyInvoices,
  getInvoicesByProject,
  updateInvoice,
  deleteInvoice,
};
