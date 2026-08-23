import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  listPayrollSchema, generatePayrollSchema, previewSchema,
  idParamSchema, updateRecordSchema, updateConfigSchema, setBasePaySchema,
} from "./payroll.validation.js";
import controller from "./payroll.controller.js";

const router = Router();

router.use(authenticate);

// Generating runs, editing records and setting pay stays with OWNER, ADMIN, HR.
const canManage = authorize("OWNER", "ADMIN", "HR");
// Finance disburses salaries, so it reads runs and records — but never writes.
const canRead = authorize("OWNER", "ADMIN", "HR", "FINANCE_MANAGER");

// Config
router.get("/config", canRead, controller.getConfig);
router.patch("/config", canManage, validate(updateConfigSchema), controller.updateConfig);

// Payroll runs
router.post("/generate", canManage, validate(generatePayrollSchema), controller.generate);
router.get("/", canRead, validate(listPayrollSchema), controller.list);
router.get("/preview/:userId", canRead, validate(previewSchema), controller.previewUser);
router.get("/history/:userId", canRead, controller.getUserHistory);
router.patch("/base-pay/:userId", canManage, validate(setBasePaySchema), controller.setUserBasePay);
router.get("/:id", canRead, validate(idParamSchema), controller.getRecord);
router.patch("/:id", canManage, validate(updateRecordSchema), controller.updateRecord);
router.delete("/:id", canManage, validate(idParamSchema), controller.deleteRecord);

export default router;
