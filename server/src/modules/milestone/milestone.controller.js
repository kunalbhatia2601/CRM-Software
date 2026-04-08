import milestoneService from "./milestone.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class MilestoneController {
  create = catchAsync(async (req, res) => {
    const milestone = await milestoneService.createMilestone(req.body, req.user.id);
    return created(res, "Milestone created", milestone);
  });

  getByProject = catchAsync(async (req, res) => {
    const milestones = await milestoneService.getMilestonesByProject(req.params.projectId, req.user.id);
    return ok(res, "Milestones retrieved", milestones);
  });

  getById = catchAsync(async (req, res) => {
    const milestone = await milestoneService.getMilestoneById(req.params.id, req.user.id);
    return ok(res, "Milestone retrieved", milestone);
  });

  update = catchAsync(async (req, res) => {
    const milestone = await milestoneService.updateMilestone(req.params.id, req.body, req.user.id);
    return ok(res, "Milestone updated", milestone);
  });

  delete = catchAsync(async (req, res) => {
    await milestoneService.deleteMilestone(req.params.id, req.user.id);
    return ok(res, "Milestone deleted");
  });

  reorder = catchAsync(async (req, res) => {
    const milestones = await milestoneService.reorderMilestones(req.params.projectId, req.body.milestoneIds, req.user.id);
    return ok(res, "Milestones reordered", milestones);
  });
}

export default new MilestoneController();
