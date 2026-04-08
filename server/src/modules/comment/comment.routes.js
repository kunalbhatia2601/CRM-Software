import { Router } from "express";
import commentController from "./comment.controller.js";
import authenticate from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createCommentSchema,
  getCommentsSchema,
  deleteCommentSchema,
} from "./comment.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createCommentSchema), commentController.create);
router.get("/:entityType/:entityId", validate(getCommentsSchema), commentController.getByEntity);
router.delete("/:id", validate(deleteCommentSchema), commentController.delete);

export default router;
