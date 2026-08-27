import service from "./payment-account.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

const MANAGER_ROLES = ["OWNER", "ADMIN", "FINANCE_MANAGER"];

class PaymentAccountController {
  list = catchAsync(async (req, res) => {
    // Only the people who manage accounts need to see retired ones.
    const includeInactive =
      MANAGER_ROLES.includes(req.user.role) && req.query.includeInactive === "true";
    const accounts = await service.list({ includeInactive });
    return ok(res, "Payment accounts retrieved", accounts);
  });

  getById = catchAsync(async (req, res) => {
    const account = await service.getById(req.params.id);
    return ok(res, "Payment account retrieved", account);
  });

  create = catchAsync(async (req, res) => {
    const account = await service.create(req.body);
    return created(res, "Payment account created", account);
  });

  update = catchAsync(async (req, res) => {
    const account = await service.update(req.params.id, req.body);
    return ok(res, "Payment account updated", account);
  });

  delete = catchAsync(async (req, res) => {
    const result = await service.remove(req.params.id);
    return ok(res, result ? "Account deactivated (it is used on invoices)" : "Account deleted", result);
  });
}

export default new PaymentAccountController();
