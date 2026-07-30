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

// Payroll + KPI config — OWNER, ADMIN, HR.
const canManage = authorize("OWNER", "ADMIN", "HR");

// Config
router.get("/config", canManage, controller.getConfig);
router.patch("/config", canManage, validate(updateConfigSchema), controller.updateConfig);

// Payroll runs
router.post("/generate", canManage, validate(generatePayrollSchema), controller.generate);
router.get("/", canManage, validate(listPayrollSchema), controller.list);
router.get("/preview/:userId", canManage, validate(previewSchema), controller.previewUser);
router.get("/history/:userId", canManage, controller.getUserHistory);
router.patch("/base-pay/:userId", canManage, validate(setBasePaySchema), controller.setUserBasePay);
router.get("/:id", canManage, validate(idParamSchema), controller.getRecord);
router.patch("/:id", canManage, validate(updateRecordSchema), controller.updateRecord);
router.delete("/:id", canManage, validate(idParamSchema), controller.deleteRecord);

export default router;
