import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import jobService from "./job.service.js";

// ── HR-managed ──
const createJob = catchAsync(async (req, res) => {
  const job = await jobService.createJob(req.body, req.user.id);
  return created(res, "Job created", job);
});
const listJobs = catchAsync(async (req, res) => {
  const result = await jobService.listJobs(req.query);
  return ok(res, "Jobs retrieved", result);
});
const getJob = catchAsync(async (req, res) => {
  const job = await jobService.getJobById(req.params.id);
  return ok(res, "Job retrieved", job);
});
const updateJob = catchAsync(async (req, res) => {
  const job = await jobService.updateJob(req.params.id, req.body);
  return ok(res, "Job updated", job);
});
const deleteJob = catchAsync(async (req, res) => {
  await jobService.deleteJob(req.params.id);
  return ok(res, "Job deleted");
});

// ── Applications (HR) ──
const listApplications = catchAsync(async (req, res) => {
  const result = await jobService.listApplications(req.params.id);
  return ok(res, "Applications retrieved", result);
});
const updateApplication = catchAsync(async (req, res) => {
  const application = await jobService.updateApplication(req.params.id, req.body);
  return ok(res, "Application updated", application);
});

// ── Public ──
const listPublicJobs = catchAsync(async (_req, res) => {
  const jobs = await jobService.listPublicJobs();
  return ok(res, "Open positions", jobs);
});
const getPublicJob = catchAsync(async (req, res) => {
  const job = await jobService.getPublicJob(req.params.slug);
  return ok(res, "Job", job);
});
const apply = catchAsync(async (req, res) => {
  const application = await jobService.apply(req.params.slug, req.body);
  return created(res, "Application submitted", { id: application.id });
});

export default {
  createJob, listJobs, getJob, updateJob, deleteJob,
  listApplications, updateApplication,
  listPublicJobs, getPublicJob, apply,
};
