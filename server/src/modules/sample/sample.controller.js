import sampleService from "./sample.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class SampleController {
  // ─── CRUD ──────────────────────────────────────────────

  createSample = catchAsync(async (req, res) => {
    const sample = await sampleService.createSample(req.body, req.user.id);
    return created(res, "Sample created successfully", sample);
  });

  listSamples = catchAsync(async (req, res) => {
    const result = await sampleService.listSamples(req.query);
    return ok(res, "Samples retrieved", result);
  });

  getSampleById = catchAsync(async (req, res) => {
    const sample = await sampleService.getSampleById(req.params.id);
    return ok(res, "Sample retrieved", sample);
  });

  updateSample = catchAsync(async (req, res) => {
    const sample = await sampleService.updateSample(req.params.id, req.body);
    return ok(res, "Sample updated successfully", sample);
  });

  deleteSample = catchAsync(async (req, res) => {
    await sampleService.deleteSample(req.params.id);
    return ok(res, "Sample deleted successfully");
  });

  getDropdown = catchAsync(async (req, res) => {
    const samples = await sampleService.getSamplesDropdown();
    return ok(res, "Samples dropdown", samples);
  });

  // ─── Lead ↔ Sample ────────────────────────────────────

  attachToLead = catchAsync(async (req, res) => {
    const result = await sampleService.attachSamplesToLead(req.params.id, req.body.sampleIds);
    return ok(res, "Samples attached to lead", result);
  });

  detachFromLead = catchAsync(async (req, res) => {
    await sampleService.detachSampleFromLead(req.params.id, req.params.sampleId);
    return ok(res, "Sample detached from lead");
  });

  getByLead = catchAsync(async (req, res) => {
    const samples = await sampleService.getSamplesByLead(req.params.id);
    return ok(res, "Lead samples retrieved", samples);
  });

  // ─── Deal ↔ Sample ────────────────────────────────────

  attachToDeal = catchAsync(async (req, res) => {
    const result = await sampleService.attachSamplesToDeal(req.params.id, req.body.sampleIds);
    return ok(res, "Samples attached to deal", result);
  });

  detachFromDeal = catchAsync(async (req, res) => {
    await sampleService.detachSampleFromDeal(req.params.id, req.params.sampleId);
    return ok(res, "Sample detached from deal");
  });

  getByDeal = catchAsync(async (req, res) => {
    const samples = await sampleService.getSamplesByDeal(req.params.id);
    return ok(res, "Deal samples retrieved", samples);
  });
}

export default new SampleController();
