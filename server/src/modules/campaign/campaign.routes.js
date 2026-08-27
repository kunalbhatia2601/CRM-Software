import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import controller from "./campaign.controller.js";
import {
  createTypeSchema, updateTypeSchema,
  createCampaignSchema, updateCampaignSchema, listCampaignsSchema,
  idParamSchema, upsertStatSchema, listStatsSchema, statDateParamSchema,
  ledgerQuerySchema, addBudgetEntrySchema, entryIdParamSchema, overviewQuerySchema,
} from "./campaign.validation.js";

const router = Router();

router.use(authenticate);

// Marketing runs campaigns; owner and admin oversee. Finance reads spend.
const marketing = authorize("OWNER", "ADMIN", "MARKETING_MANAGER");
const readers = authorize("OWNER", "ADMIN", "MARKETING_MANAGER", "FINANCE_MANAGER");
const adminOnly = authorize("OWNER", "ADMIN");

// ─── Types ───
router.get("/types", readers, controller.listTypes);
router.post("/types", adminOnly, validate(createTypeSchema), controller.createType);
router.patch("/types/:id", adminOnly, validate(updateTypeSchema), controller.updateType);
router.delete("/types/:id", adminOnly, validate(idParamSchema), controller.deleteType);

// ─── Ad budget ─── (named routes before "/:id")
// Marketing spends the budget; only the money roles may release funds into it.
const funders = authorize("OWNER", "ADMIN", "FINANCE_MANAGER");

router.get("/budget/overview", readers, validate(overviewQuerySchema), controller.budgetOverview);
router.get("/budget/project/:projectId", readers, controller.projectBudget);
router.get("/budget/project/:projectId/ledger", readers, validate(ledgerQuerySchema), controller.ledger);
router.post("/budget/project/:projectId/entries", funders, validate(addBudgetEntrySchema), controller.addEntry);
router.delete("/budget/entries/:entryId", funders, validate(entryIdParamSchema), controller.deleteEntry);

// ─── Campaigns ───
router.post("/", marketing, validate(createCampaignSchema), controller.create);
router.get("/", readers, validate(listCampaignsSchema), controller.list);
router.get("/:id", readers, validate(idParamSchema), controller.getById);
router.patch("/:id", marketing, validate(updateCampaignSchema), controller.update);
router.delete("/:id", adminOnly, validate(idParamSchema), controller.delete);

// ─── Daily results ───
router.get("/:id/stats", readers, validate(listStatsSchema), controller.listStats);
router.post("/:id/stats", marketing, validate(upsertStatSchema), controller.upsertStat);
router.delete("/:id/stats/:date", marketing, validate(statDateParamSchema), controller.deleteStat);

export default router;
