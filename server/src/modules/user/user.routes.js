import { Router } from "express";
import userController from "./user.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  listUsersSchema,
  getUserSchema,
} from "./user.validation.js";

const router = Router();

// All routes require auth
router.use(authenticate);

// Read routes accessible to HR/OWNER/ADMIN (declared BEFORE the OWNER-only
// router.use() below so they keep their own broader auth scope).
const staffRead = authorize("OWNER", "ADMIN", "HR");

// Minimal user directory (read-only, no sensitive fields).
router.get("/directory", staffRead, userController.listDirectory);
// Full user + report — HR needs these for the employee profile page.
router.get("/:id", staffRead, validate(getUserSchema), userController.getUserById);
router.get("/:id/report", staffRead, validate(getUserSchema), userController.getUserReport);

// All remaining routes are OWNER-only
router.use(authorize("OWNER"));

router.post("/", validate(createUserSchema), userController.createUser);
router.get("/", validate(listUsersSchema), userController.listUsers);
router.patch("/:id", validate(updateUserSchema), userController.updateUser);
router.post("/:id/reset-password", validate(resetPasswordSchema), userController.resetPassword);
router.delete("/:id", validate(getUserSchema), userController.deleteUser);

export default router;
