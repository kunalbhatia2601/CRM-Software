import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createJobSchema, updateJobSchema, listJobsSchema, idParamSchema,
  slugParamSchema, applySchema, updateApplicationSchema,
} from "./job.validation.js";
import controller from "./job.controller.js";

const router = Router();

// ── Public (no auth) — careers page + apply ──
router.get("/public", controller.listPublicJobs);
router.get("/public/:slug", validate(slugParamSchema), controller.getPublicJob);
router.post("/public/:slug/apply", validate(applySchema), controller.apply);

// ── Everything below requires auth ──
router.use(authenticate);

const canManage = authorize("OWNER", "ADMIN", "HR");

router.post("/", canManage, validate(createJobSchema), controller.createJob);
router.get("/", canManage, validate(listJobsSchema), controller.listJobs);
router.get("/:id", canManage, validate(idParamSchema), controller.getJob);
router.patch("/:id", canManage, validate(updateJobSchema), controller.updateJob);
router.delete("/:id", canManage, validate(idParamSchema), controller.deleteJob);

router.get("/:id/applications", canManage, validate(idParamSchema), controller.listApplications);
router.patch("/applications/:id", canManage, validate(updateApplicationSchema), controller.updateApplication);

export default router;
