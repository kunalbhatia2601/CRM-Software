import planningStepService from "./planning-step.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class PlanningStepController {
  create = catchAsync(async (req, res) => {
    const step = await planningStepService.createStep(req.body, req.user.id);
    return created(res, "Planning step created", step);
  });

  getByProject = catchAsync(async (req, res) => {
    const steps = await planningStepService.getStepsByProject(req.params.projectId, req.user.id);
    return ok(res, "Planning steps retrieved", steps);
  });

  getById = catchAsync(async (req, res) => {
    const step = await planningStepService.getStepById(req.params.id, req.user.id);
    return ok(res, "Planning step retrieved", step);
  });

  update = catchAsync(async (req, res) => {
    const step = await planningStepService.updateStep(req.params.id, req.body, req.user.id);
    return ok(res, "Planning step updated", step);
  });

  delete = catchAsync(async (req, res) => {
    await planningStepService.deleteStep(req.params.id, req.user.id);
    return ok(res, "Planning step deleted");
  });

  reorder = catchAsync(async (req, res) => {
    const steps = await planningStepService.reorderSteps(req.params.projectId, req.body.stepIds, req.user.id);
    return ok(res, "Planning steps reordered", steps);
  });
}

export default new PlanningStepController();
