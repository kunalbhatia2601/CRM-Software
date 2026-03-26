import { Router } from "express";
import authenticate from "../../middlewares/auth.middleware.js";
import controller from "./storage.controller.js";

const router = Router();

// All upload routes require authentication (any logged-in user can upload)
router.get("/upload-config", authenticate, controller.getUploadConfig);

// Local upload — streaming (no body-parser, raw body piped to disk)
// Note: express.json() won't interfere because Content-Type won't be application/json
router.post("/upload/local", authenticate, controller.uploadLocal);

// Serve local files — public (no auth, files are served by their key)
router.get("/files/*", controller.serveFile);

export default router;
