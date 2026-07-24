import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createAnnouncementSchema, listAnnouncementsSchema, idParamSchema } from "./announcement.validation.js";
import controller from "./announcement.controller.js";

const router = Router();

router.use(authenticate);

// Any authenticated user can read announcements (list).
router.get("/", validate(listAnnouncementsSchema), controller.list);

// Post / delete — OWNER, ADMIN, HR.
const canManage = authorize("OWNER", "ADMIN", "HR");
router.post("/", canManage, validate(createAnnouncementSchema), controller.create);
router.delete("/:id", canManage, validate(idParamSchema), controller.remove);

export default router;
