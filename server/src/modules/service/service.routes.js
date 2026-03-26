import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import { createServiceSchema, updateServiceSchema, listServicesSchema, getServiceSchema } from "./service.validation.js";
import controller from "./service.controller.js";

const router = Router();

// All routes require auth
router.use(authenticate);

// Dropdown (active services) — accessible by OWNER, ADMIN, SALES_MANAGER, ACCOUNT_MANAGER
router.get("/dropdown", authorize("OWNER", "ADMIN", "SALES_MANAGER", "ACCOUNT_MANAGER"), controller.getActiveServices);

// CRUD — OWNER and ADMIN only
router.post("/", authorize("OWNER", "ADMIN"), validate(createServiceSchema), controller.createService);
router.get("/", authorize("OWNER", "ADMIN"), validate(listServicesSchema), controller.listServices);
router.get("/:id", authorize("OWNER", "ADMIN"), validate(getServiceSchema), controller.getService);
router.patch("/:id", authorize("OWNER", "ADMIN"), validate(updateServiceSchema), controller.updateService);
router.delete("/:id", authorize("OWNER", "ADMIN"), validate(getServiceSchema), controller.deleteService);

export default router;
