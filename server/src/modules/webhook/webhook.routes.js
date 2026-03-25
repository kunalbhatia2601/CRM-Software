import { Router } from "express";
import webhookController from "./webhook.controller.js";

const router = Router();

// These are PUBLIC endpoints — Meta sends requests here directly.
// No auth middleware needed (Meta can't authenticate with our JWT).

// Webhook verification (Meta handshake)
router.get("/meta-leads", (req, res) => webhookController.verifyWebhook(req, res));

// Incoming lead notifications
router.post("/meta-leads", (req, res) => webhookController.handleLeadWebhook(req, res));

export default router;
