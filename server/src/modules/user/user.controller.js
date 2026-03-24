import userService from "./user.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class UserController {
  /**
   * POST /api/users
   */
  createUser = catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    return created(res, "User created successfully", user);
  });

  /**
   * GET /api/users
   */
  listUsers = catchAsync(async (req, res) => {
    const result = await userService.listUsers(req.query);
    return ok(res, "Users retrieved", result);
  });

  /**
   * GET /api/users/:id
   */
  getUserById = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    return ok(res, "User retrieved", user);
  });

  /**
   * PATCH /api/users/:id
   */
  updateUser = catchAsync(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    return ok(res, "User updated successfully", user);
  });

  /**
   * POST /api/users/:id/reset-password
   */
  resetPassword = catchAsync(async (req, res) => {
    await userService.resetPassword(req.params.id, req.body.newPassword);
    return ok(res, "Password reset successfully");
  });

  /**
   * GET /api/users/:id/report
   */
  getUserReport = catchAsync(async (req, res) => {
    const report = await userService.getUserReport(req.params.id);
    return ok(res, "User report retrieved", report);
  });

  /**
   * DELETE /api/users/:id
   */
  deleteUser = catchAsync(async (req, res) => {
    await userService.deleteUser(req.params.id, req.user.id);
    return ok(res, "User deleted successfully");
  });
}

export default new UserController();
