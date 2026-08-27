import campaignService from "./campaign.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class CampaignController {
  // ─── Types ───
  listTypes = catchAsync(async (req, res) => {
    const includeInactive =
      ["OWNER", "ADMIN", "MARKETING_MANAGER"].includes(req.user.role) &&
      req.query.includeInactive === "true";
    const types = await campaignService.listTypes({ includeInactive });
    return ok(res, "Campaign types retrieved", types);
  });

  createType = catchAsync(async (req, res) => {
    const type = await campaignService.createType(req.body);
    return created(res, "Campaign type created", type);
  });

  updateType = catchAsync(async (req, res) => {
    const type = await campaignService.updateType(req.params.id, req.body);
    return ok(res, "Campaign type updated", type);
  });

  deleteType = catchAsync(async (req, res) => {
    const result = await campaignService.removeType(req.params.id);
    return ok(res, result ? "Type deactivated (it has campaigns)" : "Type deleted", result);
  });

  // ─── Campaigns ───
  create = catchAsync(async (req, res) => {
    const campaign = await campaignService.create(req.body, req.user);
    return created(res, "Campaign created", campaign);
  });

  list = catchAsync(async (req, res) => {
    const data = await campaignService.list(req.query);
    return ok(res, "Campaigns retrieved", data);
  });

  getById = catchAsync(async (req, res) => {
    const campaign = await campaignService.getById(req.params.id);
    return ok(res, "Campaign retrieved", campaign);
  });

  update = catchAsync(async (req, res) => {
    const campaign = await campaignService.update(req.params.id, req.body, req.user);
    return ok(res, "Campaign updated", campaign);
  });

  delete = catchAsync(async (req, res) => {
    await campaignService.remove(req.params.id);
    return ok(res, "Campaign deleted");
  });

  // ─── Daily stats ───
  upsertStat = catchAsync(async (req, res) => {
    const campaign = await campaignService.upsertStat(req.params.id, req.body, req.user);
    return ok(res, "Results recorded", campaign);
  });

  listStats = catchAsync(async (req, res) => {
    const stats = await campaignService.listStats(req.params.id, req.query);
    return ok(res, "Results retrieved", stats);
  });

  deleteStat = catchAsync(async (req, res) => {
    await campaignService.removeStat(req.params.id, req.params.date);
    return ok(res, "Results removed");
  });

  // ─── Ad budget ledger ───
  ledger = catchAsync(async (req, res) => {
    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const data = await campaignService.ledger(req.params.projectId, year, month);
    return ok(res, "Ad budget ledger retrieved", data);
  });

  addEntry = catchAsync(async (req, res) => {
    const data = await campaignService.addEntry(req.params.projectId, req.body, req.user);
    return created(res, "Funds released", data);
  });

  deleteEntry = catchAsync(async (req, res) => {
    const data = await campaignService.removeEntry(req.params.entryId, req.user);
    return ok(res, "Entry removed", data);
  });

  budgetOverview = catchAsync(async (req, res) => {
    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const rows = await campaignService.budgetOverview(year, month);
    return ok(res, "Ad budget overview retrieved", rows);
  });

  // ─── Budget ───
  projectBudget = catchAsync(async (req, res) => {
    const { year, month } = req.query;
    const budget = await campaignService.projectBudget(
      req.params.projectId,
      year ? Number(year) : null,
      month ? Number(month) : null
    );
    return ok(res, "Project ad budget retrieved", budget);
  });
}

export default new CampaignController();
