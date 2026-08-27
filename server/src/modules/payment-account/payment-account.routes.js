import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import controller from "./payment-account.controller.js";
import {
  createAccountSchema, updateAccountSchema, idParamSchema, listAccountsSchema,
} from "./payment-account.validation.js";

const router = Router();

router.use(authenticate);

// Finance owns the money rails alongside owner and admin.
const canManage = authorize("OWNER", "ADMIN", "FINANCE_MANAGER");
// Anyone who can raise an invoice needs to pick an account on it.
const canRead = authorize("OWNER", "ADMIN", "FINANCE_MANAGER", "SALES_MANAGER", "ACCOUNT_MANAGER");

router.get("/", canRead, validate(listAccountsSchema), controller.list);
router.get("/:id", canRead, validate(idParamSchema), controller.getById);
router.post("/", canManage, validate(createAccountSchema), controller.create);
router.patch("/:id", canManage, validate(updateAccountSchema), controller.update);
router.delete("/:id", canManage, validate(idParamSchema), controller.delete);

export default router;
