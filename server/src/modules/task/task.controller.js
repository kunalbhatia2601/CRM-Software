import taskService from "./task.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import { getProjectAssignableUsers } from "../../utils/projectPermission.js";

class TaskController {
  create = catchAsync(async (req, res) => {
    const task = await taskService.createTask(req.body, req.user.id);
    return created(res, "Task created", task);
  });

  getByProject = catchAsync(async (req, res) => {
    const tasks = await taskService.getTasksByProject(req.params.projectId, req.user.id, req.query);
    return ok(res, "Tasks retrieved", tasks);
  });

  getById = catchAsync(async (req, res) => {
    const task = await taskService.getTaskById(req.params.id, req.user.id);
    return ok(res, "Task retrieved", task);
  });

  update = catchAsync(async (req, res) => {
    const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
    return ok(res, "Task updated", task);
  });

  delete = catchAsync(async (req, res) => {
    await taskService.deleteTask(req.params.id, req.user.id);
    return ok(res, "Task deleted");
  });

  bulkUpdateStatus = catchAsync(async (req, res) => {
    const tasks = await taskService.bulkUpdateStatus(req.body.taskIds, req.body.status, req.user.id);
    return ok(res, "Tasks updated", tasks);
  });

  getAssignableUsers = catchAsync(async (req, res) => {
    const users = await getProjectAssignableUsers(req.params.projectId);
    return ok(res, "Assignable users retrieved", users);
  });

  addFeedback = catchAsync(async (req, res) => {
    const task = await taskService.addFeedback(req.params.id, req.body, req.user.id);
    return created(res, "Feedback added", task);
  });

  getChildTasks = catchAsync(async (req, res) => {
    const children = await taskService.getChildTasks(req.params.id, req.user.id);
    return ok(res, "Child tasks retrieved", children);
  });
}

export default new TaskController();
