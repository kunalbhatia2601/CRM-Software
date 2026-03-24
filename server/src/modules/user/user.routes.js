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

// All routes require auth + OWNER role
router.use(authenticate);
router.use(authorize("OWNER"));

router.post("/", validate(createUserSchema), userController.createUser);
router.get("/", validate(listUsersSchema), userController.listUsers);
router.get("/:id", validate(getUserSchema), userController.getUserById);
router.get("/:id/report", validate(getUserSchema), userController.getUserReport);
router.patch("/:id", validate(updateUserSchema), userController.updateUser);
router.post("/:id/reset-password", validate(resetPasswordSchema), userController.resetPassword);
router.delete("/:id", validate(getUserSchema), userController.deleteUser);

export default router;
