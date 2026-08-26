import { Router } from "express";
import projectController from "./project.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  getProjectSchema,
  addProjectServicesSchema,
  updateProjectServiceSchema,
  projectServiceParamSchema,
} from "./project.validation.js";

const router = Router();

router.use(authenticate);

const projectAccess = authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER", "SALES_MANAGER", "FINANCE_MANAGER", "CLIENT", "EMPLOYEE");

router.post("/", authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER"), validate(createProjectSchema), projectController.createProject);
// Attribution picker — every staff role, HR included. Declared before "/:id"
// so it is not swallowed by the id route.
const staffPickerAccess = authorize(
  "OWNER", "ADMIN", "ACCOUNT_MANAGER", "SALES_MANAGER",
  "FINANCE_MANAGER", "HR", "EMPLOYEE"
);
router.get("/options", staffPickerAccess, projectController.getProjectOptions);

router.get("/", projectAccess, validate(listProjectsSchema), projectController.listProjects);
router.get("/:id", projectAccess, validate(getProjectSchema), projectController.getProjectById);
router.get("/:id/permissions", projectAccess, validate(getProjectSchema), projectController.getPermissions);
router.patch("/:id", authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER"), validate(updateProjectSchema), projectController.updateProject);
router.delete("/:id", authorize("OWNER"), validate(getProjectSchema), projectController.deleteProject);

// ─── Project Services (manage) ───
const manageServices = authorize("OWNER", "ADMIN", "ACCOUNT_MANAGER", "SALES_MANAGER");

router.post("/:id/services", manageServices, validate(addProjectServicesSchema), projectController.addServices);
router.patch("/:id/services/:serviceId", manageServices, validate(updateProjectServiceSchema), projectController.updateService);
router.delete("/:id/services/:serviceId", manageServices, validate(projectServiceParamSchema), projectController.removeService);

export default router;
