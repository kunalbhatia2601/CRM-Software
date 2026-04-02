import { Router } from "express";
import sampleController from "./sample.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createSampleSchema,
  updateSampleSchema,
  listSamplesSchema,
  getSampleSchema,
  attachSampleSchema,
  detachSampleSchema,
} from "./sample.validation.js";

const router = Router();

router.use(authenticate);

const sampleAccess = authorize("OWNER", "ADMIN", "SALES_MANAGER");

// ─── Sample CRUD ────────────────────────────────────────
router.post("/", sampleAccess, validate(createSampleSchema), sampleController.createSample);
router.get("/", sampleAccess, validate(listSamplesSchema), sampleController.listSamples);
router.get("/dropdown", sampleAccess, sampleController.getDropdown);
router.get("/:id", sampleAccess, validate(getSampleSchema), sampleController.getSampleById);
router.patch("/:id", sampleAccess, validate(updateSampleSchema), sampleController.updateSample);
router.delete("/:id", authorize("OWNER"), validate(getSampleSchema), sampleController.deleteSample);

// ─── Lead ↔ Sample ─────────────────────────────────────
router.get("/lead/:id", sampleAccess, sampleController.getByLead);
router.post("/lead/:id", sampleAccess, validate(attachSampleSchema), sampleController.attachToLead);
router.delete("/lead/:id/:sampleId", sampleAccess, validate(detachSampleSchema), sampleController.detachFromLead);

// ─── Deal ↔ Sample ─────────────────────────────────────
router.get("/deal/:id", sampleAccess, sampleController.getByDeal);
router.post("/deal/:id", sampleAccess, validate(attachSampleSchema), sampleController.attachToDeal);
router.delete("/deal/:id/:sampleId", sampleAccess, validate(detachSampleSchema), sampleController.detachFromDeal);

export default router;
