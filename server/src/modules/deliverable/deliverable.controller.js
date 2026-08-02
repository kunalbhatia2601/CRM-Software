import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import deliverableService from "./deliverable.service.js";

const createDeliverable = catchAsync(async (req, res) => {
  const deliverable = await deliverableService.create(req.body, req.user.id);
  return created(res, "Deliverable created", deliverable);
});

const listByProject = catchAsync(async (req, res) => {
  const deliverables = await deliverableService.listByProject(req.params.projectId, req.user);
  return ok(res, "Deliverables retrieved", deliverables);
});

const getDeliverable = catchAsync(async (req, res) => {
  const deliverable = await deliverableService.getById(req.params.id, req.user);
  return ok(res, "Deliverable retrieved", deliverable);
});

const updateDeliverable = catchAsync(async (req, res) => {
  const deliverable = await deliverableService.update(req.params.id, req.body);
  return ok(res, "Deliverable updated", deliverable);
});

const deleteDeliverable = catchAsync(async (req, res) => {
  await deliverableService.remove(req.params.id);
  return ok(res, "Deliverable deleted");
});

const addFeedback = catchAsync(async (req, res) => {
  const deliverable = await deliverableService.addFeedback(req.params.id, req.body, req.user);
  return created(res, "Feedback submitted", deliverable);
});

export default {
  createDeliverable,
  listByProject,
  getDeliverable,
  updateDeliverable,
  deleteDeliverable,
  addFeedback,
};
