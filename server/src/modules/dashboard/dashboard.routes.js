import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import authorize from "../../middlewares/role.middleware.js";
import { getStats } from "./dashboard.controller.js";

const router = Router();

// Only OWNER and ADMIN can view dashboard stats
router.get("/stats", authenticate, authorize("OWNER", "ADMIN"), getStats);

export default router;
