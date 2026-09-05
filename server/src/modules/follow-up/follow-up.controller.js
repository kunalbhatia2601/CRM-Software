import followUpService from "./follow-up.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class FollowUpController {
  create = catchAsync(async (req, res) => {
    const followUp = await followUpService.createFollowUp(req.body, req.user.id);
    return created(res, "Follow-up created successfully", followUp);
  });

  list = catchAsync(async (req, res) => {
    const result = await followUpService.listFollowUps(req.query);
    return ok(res, "Follow-ups retrieved", result);
  });

  getById = catchAsync(async (req, res) => {
    const followUp = await followUpService.getFollowUpById(req.params.id);
    return ok(res, "Follow-up retrieved", followUp);
  });

  update = catchAsync(async (req, res) => {
    const followUp = await followUpService.updateFollowUp(req.params.id, req.body);
    return ok(res, "Follow-up updated successfully", followUp);
  });

  delete = catchAsync(async (req, res) => {
    await followUpService.deleteFollowUp(req.params.id);
    return ok(res, "Follow-up deleted successfully");
  });

  getByLead = catchAsync(async (req, res) => {
    const followUps = await followUpService.getFollowUpsByLead(req.params.leadId);
    return ok(res, "Follow-ups retrieved", followUps);
  });

  getByDeal = catchAsync(async (req, res) => {
    const followUps = await followUpService.getFollowUpsByDeal(req.params.dealId);
    return ok(res, "Follow-ups retrieved", followUps);
  });
}

export default new FollowUpController();
