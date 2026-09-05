import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import controller from "./report.controller.js";
import {
  generateSchema, listSchema, idParamSchema, updateSchema,
  clearOverrideSchema, previewSchema,
} from "./report.validation.js";

const router = Router();

router.use(authenticate);

// Owner and admin own reporting. Finance and account managers read them;
// they carry client money figures, so nobody else gets in.
const writers = authorize("OWNER", "ADMIN");
const readers = authorize("OWNER", "ADMIN", "FINANCE_MANAGER", "ACCOUNT_MANAGER");

router.get("/preview", writers, validate(previewSchema), controller.preview);
router.get("/", readers, validate(listSchema), controller.list);
router.post("/", writers, validate(generateSchema), controller.generate);

router.get("/:id", readers, validate(idParamSchema), controller.getById);
router.patch("/:id", writers, validate(updateSchema), controller.update);
router.post("/:id/clear-override", writers, validate(clearOverrideSchema), controller.clearOverride);
router.delete("/:id", writers, validate(idParamSchema), controller.remove);

export default router;
