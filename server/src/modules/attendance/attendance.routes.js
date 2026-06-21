import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import config from "../../config/index.js";
import attendanceController from "./attendance.controller.js";
import {
  checkInSchema,
  checkOutSchema,
  listMyAttendanceSchema,
  dailySheetSchema,
  userAttendanceSchema,
  manualMarkSchema,
  updateAttendanceSchema,
  deleteAttendanceSchema,
} from "./attendance.validation.js";

const router = Router();

// ── Protected cron (secret-guarded, NO JWT) ──
// Must be registered before `authenticate` so external schedulers can hit it.
// Secret via `x-cron-secret` header or `?secret=` query.
const cronGuard = (req, res, next) => {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  if (secret !== config.attendanceCronSecret) {
    return res.status(403).json({ success: false, message: "Invalid secret" });
  }
  next();
};

router.post("/cron/reconcile", cronGuard, attendanceController.runDailyReconcile);
router.post("/ingest/biometric", cronGuard, attendanceController.ingestBiometric);

router.use(authenticate);

// All authenticated non-CLIENT users can manage their own attendance
// (CLIENT is implicitly blocked since they have no attendance routes in their portal;
//  we also reject CLIENTs explicitly on the self endpoints for defense in depth)
const blockClient = (req, res, next) => {
  if (req.user.role === "CLIENT") {
    return res.status(403).json({ success: false, message: "Not available for client users" });
  }
  next();
};

// ── Self-service ──
router.post("/check-in", blockClient, validate(checkInSchema), attendanceController.checkIn);
router.post("/check-out", blockClient, validate(checkOutSchema), attendanceController.checkOut);
router.get("/today", blockClient, attendanceController.getToday);
router.get("/my", blockClient, validate(listMyAttendanceSchema), attendanceController.getMy);

// ── Admin (HR / OWNER / ADMIN) ──
const admin = authorize("OWNER", "ADMIN", "HR");

router.get("/daily", admin, validate(dailySheetSchema), attendanceController.getDailySheet);
router.get("/user/:userId", admin, validate(userAttendanceSchema), attendanceController.getUserAttendance);
router.post("/", admin, validate(manualMarkSchema), attendanceController.manualMark);
router.patch("/:id", admin, validate(updateAttendanceSchema), attendanceController.update);
router.delete("/:id", admin, validate(deleteAttendanceSchema), attendanceController.delete);

export default router;
