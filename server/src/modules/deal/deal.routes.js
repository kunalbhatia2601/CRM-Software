import { Router } from "express";
import dealController from "./deal.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createDealSchema,
  updateDealSchema,
  updateDealStageSchema,
  listDealsSchema,
  getDealSchema,
  addDealServicesSchema,
  removeDealServiceSchema,
} from "./deal.validation.js";

const router = Router();

router.use(authenticate);

const dealAccess = authorize("OWNER", "ADMIN", "SALES_MANAGER");

router.post("/", dealAccess, validate(createDealSchema), dealController.createDeal);
router.get("/", dealAccess, validate(listDealsSchema), dealController.listDeals);
router.get("/:id", dealAccess, validate(getDealSchema), dealController.getDealById);
router.patch("/:id", dealAccess, validate(updateDealSchema), dealController.updateDeal);
router.patch("/:id/stage", dealAccess, validate(updateDealStageSchema), dealController.updateDealStage);
router.delete("/:id", authorize("OWNER"), validate(getDealSchema), dealController.deleteDeal);

// Deal services
router.post("/:id/services", dealAccess, validate(addDealServicesSchema), dealController.addServicesToDeal);
router.delete("/:id/services/:serviceId", dealAccess, validate(removeDealServiceSchema), dealController.removeServiceFromDeal);

export default router;
