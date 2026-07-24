import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";
import announcementService from "./announcement.service.js";

const create = catchAsync(async (req, res) => {
  const a = await announcementService.create(req.body, req.user.id);
  return created(res, "Announcement posted", a);
});

const list = catchAsync(async (req, res) => {
  const result = await announcementService.list(req.query);
  return ok(res, "Announcements retrieved", result);
});

const remove = catchAsync(async (req, res) => {
  await announcementService.remove(req.params.id);
  return ok(res, "Announcement deleted");
});

export default { create, list, remove };
