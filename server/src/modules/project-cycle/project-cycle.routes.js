import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import controller from "./project-cycle.controller.js";
import { projectParamSchema, idParamSchema, startNextSchema } from "./project-cycle.validation.js";

const router = Router();

router.use(authenticate);

// Anyone who can open a project can look at its periods — that is how a past
// month gets reviewed. Only managers open or remove one.
const canManage = authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER", "MARKETING_MANAGER");

router.get("/project/:projectId", validate(projectParamSchema), controller.list);
router.get("/project/:projectId/current", validate(projectParamSchema), controller.current);
router.post("/project/:projectId/next", canManage, validate(startNextSchema), controller.startNext);

router.get("/:id/carry-over", validate(idParamSchema), controller.carryOverCandidates);
router.delete("/:id", canManage, validate(idParamSchema), controller.remove);

export default router;
