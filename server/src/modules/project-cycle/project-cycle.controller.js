import cycleService from "./project-cycle.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class ProjectCycleController {
  list = catchAsync(async (req, res) => {
    const cycles = await cycleService.list(req.params.projectId);
    return ok(res, "Cycles retrieved", cycles);
  });

  /** The cycle covering today, or null when the project has none. */
  current = catchAsync(async (req, res) => {
    const cycle = await cycleService.current(req.params.projectId);
    return ok(res, cycle ? "Current cycle retrieved" : "No cycle covers today", cycle);
  });

  startNext = catchAsync(async (req, res) => {
    const result = await cycleService.startNext(req.params.projectId, req.body, req.user.id);
    return created(res, `${result.cycle.label} started`, result);
  });

  carryOverCandidates = catchAsync(async (req, res) => {
    const tasks = await cycleService.carryOverCandidates(req.params.id);
    return ok(res, "Unfinished tasks retrieved", tasks);
  });

  remove = catchAsync(async (req, res) => {
    await cycleService.remove(req.params.id);
    return ok(res, "Cycle deleted");
  });
}

export default new ProjectCycleController();
