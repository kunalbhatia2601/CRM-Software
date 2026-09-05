import reportService from "./report.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class ReportController {
  /** Build a report without saving it — used by the month picker's preview. */
  preview = catchAsync(async (req, res) => {
    const { projectId, year, month } = req.query;
    const snapshot = await reportService.buildSnapshot(projectId, Number(year), Number(month));
    return ok(res, "Report preview generated", { snapshot });
  });

  generate = catchAsync(async (req, res) => {
    const { projectId, year, month, refresh } = req.body;
    const report = await reportService.generate(projectId, year, month, req.user.id, { refresh });
    return created(res, "Report generated", report);
  });

  list = catchAsync(async (req, res) => {
    const result = await reportService.list({
      projectId: req.query.projectId,
      year: req.query.year,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return ok(res, "Reports retrieved", result);
  });

  getById = catchAsync(async (req, res) => {
    const report = await reportService.getById(req.params.id);
    return ok(res, "Report retrieved", report);
  });

  update = catchAsync(async (req, res) => {
    const report = await reportService.update(req.params.id, req.body, req.user.id);
    return ok(res, "Report updated", report);
  });

  clearOverride = catchAsync(async (req, res) => {
    const report = await reportService.clearOverride(req.params.id, req.body.path);
    return ok(res, "Override cleared", report);
  });

  remove = catchAsync(async (req, res) => {
    await reportService.remove(req.params.id);
    return ok(res, "Report deleted");
  });
}

export default new ReportController();
