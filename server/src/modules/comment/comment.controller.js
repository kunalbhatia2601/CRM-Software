import commentService from "./comment.service.js";
import catchAsync from "../../utils/catchAsync.js";
import { ok, created } from "../../utils/apiResponse.js";

class CommentController {
  create = catchAsync(async (req, res) => {
    const comment = await commentService.createComment(req.body, req.user.id);
    return created(res, "Comment added", comment);
  });

  getByEntity = catchAsync(async (req, res) => {
    const comments = await commentService.getComments(
      req.params.entityType,
      req.params.entityId,
      req.user.id
    );
    return ok(res, "Comments retrieved", comments);
  });

  delete = catchAsync(async (req, res) => {
    await commentService.deleteComment(req.params.id, req.user.id);
    return ok(res, "Comment deleted");
  });
}

export default new CommentController();
