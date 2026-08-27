import leadService from "./lead.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class LeadController {
  /**
   * POST /api/leads
   */
  createLead = catchAsync(async (req, res) => {
    const lead = await leadService.createLead(req.body, req.user.id);
    return created(res, "Lead created successfully", lead);
  });

  /**
   * GET /api/leads
   */
  listLeads = catchAsync(async (req, res) => {
    const result = await leadService.listLeads(req.query);
    return ok(res, "Leads retrieved", result);
  });

  /**
   * GET /api/leads/:id
   */
  getLeadById = catchAsync(async (req, res) => {
    const lead = await leadService.getLeadById(req.params.id);
    return ok(res, "Lead retrieved", lead);
  });

  /**
   * PATCH /api/leads/:id
   */
  updateLead = catchAsync(async (req, res) => {
    const lead = await leadService.updateLead(req.params.id, req.body, req.user);
    return ok(res, "Lead updated successfully", lead);
  });

  /**
   * PATCH /api/leads/:id/status
   */
  updateLeadStatus = catchAsync(async (req, res) => {
    const { status, lostReason } = req.body;
    const lead = await leadService.updateLeadStatus(req.params.id, status, lostReason);
    return ok(res, `Lead status updated to ${status}`, lead);
  });

  /**
   * DELETE /api/leads/:id
   */
  deleteLead = catchAsync(async (req, res) => {
    await leadService.deleteLead(req.params.id);
    return ok(res, "Lead deleted successfully");
  });
}

export default new LeadController();
