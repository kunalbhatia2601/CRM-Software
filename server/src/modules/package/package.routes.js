import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createPackageSchema, updatePackageSchema, listPackagesSchema, getPackageSchema } from "./package.validation.js";
import controller from "./package.controller.js";

const router = Router();

router.use(authenticate);

// Dropdown (active packages) — same audience as the service dropdown, since
// this is where a package gets picked to add to a deal or project.
router.get("/dropdown", authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"), controller.getActivePackages);

// CRUD — OWNER and ADMIN only, same as services.
router.post("/", authorize("OWNER", "ADMIN"), validate(createPackageSchema), controller.createPackage);
router.get("/", authorize("OWNER", "ADMIN"), validate(listPackagesSchema), controller.listPackages);
router.get("/:id", authorize("OWNER", "ADMIN"), validate(getPackageSchema), controller.getPackage);
router.patch("/:id", authorize("OWNER", "ADMIN"), validate(updatePackageSchema), controller.updatePackage);
router.delete("/:id", authorize("OWNER", "ADMIN"), validate(getPackageSchema), controller.deletePackage);

export default router;
