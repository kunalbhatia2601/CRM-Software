import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import payrollService from "./payroll.service.js";

// ── Config ──
const getConfig = catchAsync(async (_req, res) => {
  const config = await payrollService.getConfig();
  return ok(res, "KPI config", config);
});
const updateConfig = catchAsync(async (req, res) => {
  const config = await payrollService.updateConfig(req.body);
  return ok(res, "KPI config updated", config);
});

// ── Payroll ──
const generate = catchAsync(async (req, res) => {
  const result = await payrollService.generate(Number(req.body.year), Number(req.body.month));
  return created(res, "Payroll generated", result);
});
const list = catchAsync(async (req, res) => {
  const result = await payrollService.list(Number(req.query.year), Number(req.query.month));
  return ok(res, "Payroll", result);
});
const getRecord = catchAsync(async (req, res) => {
  const record = await payrollService.getRecord(req.params.id);
  return ok(res, "Payroll record", record);
});
const previewUser = catchAsync(async (req, res) => {
  const preview = await payrollService.previewUser(req.params.userId, Number(req.query.year), Number(req.query.month));
  return ok(res, "Payroll preview", preview);
});
const getUserHistory = catchAsync(async (req, res) => {
  const history = await payrollService.getUserHistory(req.params.userId);
  return ok(res, "Payroll history", history);
});
const setUserBasePay = catchAsync(async (req, res) => {
  const user = await payrollService.setUserBasePay(req.params.userId, req.body.basePay);
  return ok(res, "Base pay updated", user);
});
const updateRecord = catchAsync(async (req, res) => {
  const record = await payrollService.updateRecord(req.params.id, req.body);
  return ok(res, "Payroll record updated", record);
});
const deleteRecord = catchAsync(async (req, res) => {
  await payrollService.deleteRecord(req.params.id);
  return ok(res, "Payroll record deleted");
});

export default { getConfig, updateConfig, generate, list, getRecord, previewUser, getUserHistory, setUserBasePay, updateRecord, deleteRecord };
