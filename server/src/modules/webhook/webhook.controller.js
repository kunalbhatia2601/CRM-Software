/**
 * Meta Lead Ads Webhook Controller
 *
 * Handles:
 *  1. GET  /api/webhooks/meta-leads — Webhook verification (Meta handshake)
 *  2. POST /api/webhooks/meta-leads — Incoming lead notifications
 *
 * When Meta sends a new lead, we:
 *  - Fetch the full lead data from the Leads API
 *  - Create a new Lead in our CRM with source = META_AD
 */

import prisma from "../../utils/prisma.js";
import settingsService from "../settings/settings.service.js";
import metaService from "../campaign/meta.service.js";

class WebhookController {
  /**
   * GET /api/webhooks/meta-leads
   * Meta webhook verification handshake.
   */
  async verifyWebhook(req, res) {
    try {
      const settings = await settingsService.getRawSettings();
      const verifyToken = settings.metaWebhookVerifyToken;

      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === verifyToken) {
        console.log("[Meta Webhook] Verification successful");
        return res.status(200).send(challenge);
      }

      console.warn("[Meta Webhook] Verification failed — token mismatch");
      return res.status(403).send("Verification failed");
    } catch (err) {
      console.error("[Meta Webhook] Verification error:", err.message);
      return res.status(500).send("Error");
    }
  }

  /**
   * POST /api/webhooks/meta-leads
   * Receives real-time lead notifications from Meta.
   */
  async handleLeadWebhook(req, res) {
    // Always respond 200 immediately — Meta retries if it doesn't get 200 fast
    res.status(200).send("EVENT_RECEIVED");

    try {
      const body = req.body;

      if (body.object !== "page") return;

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "leadgen") {
            await this._processLead(change.value);
          }
        }
      }
    } catch (err) {
      console.error("[Meta Webhook] Error processing lead:", err.message);
    }
  }

  /**
   * Process a single lead notification from Meta.
   */
  async _processLead(leadData) {
    const { leadgen_id, form_id, page_id, ad_id, created_time } = leadData;

    console.log(`[Meta Webhook] New lead: ${leadgen_id} from form ${form_id}`);

    try {
      // Fetch full lead data from Meta API
      const config = await metaService.getConfig();
      const url = `https://graph.facebook.com/v21.0/${leadgen_id}?access_token=${config.accessToken}&fields=id,created_time,field_data,ad_id,form_id`;

      const response = await fetch(url);
      const lead = await response.json();

      if (lead.error) {
        console.error("[Meta Webhook] Failed to fetch lead data:", lead.error.message);
        return;
      }

      // Parse field data
      const fields = {};
      (lead.field_data || []).forEach((f) => {
        fields[f.name] = f.values?.[0] || "";
      });

      // Map to our CRM lead format
      const contactName = [fields.first_name, fields.last_name].filter(Boolean).join(" ")
        || fields.full_name
        || fields.name
        || "Meta Lead";

      const companyName = fields.company_name || fields.company || "Meta Lead Ad";

      // Find the OWNER user for createdById
      const owner = await prisma.user.findFirst({
        where: { role: "OWNER" },
        select: { id: true },
      });

      if (!owner) {
        console.error("[Meta Webhook] No OWNER user found — cannot create lead");
        return;
      }

      // Check for duplicate (same email from same company)
      if (fields.email) {
        const existing = await prisma.lead.findFirst({
          where: {
            email: fields.email,
            companyName,
            status: { notIn: ["LOST"] },
          },
        });

        if (existing) {
          console.log(`[Meta Webhook] Duplicate lead skipped: ${fields.email} from ${companyName}`);
          return;
        }
      }

      // Create the lead in our CRM
      const newLead = await prisma.lead.create({
        data: {
          companyName,
          contactName,
          email: fields.email || null,
          phone: fields.phone_number || fields.phone || null,
          source: "META_AD",
          status: "NEW",
          priority: "HIGH", // Meta leads are high intent
          notes: [
            `Source: Meta Lead Ad`,
            `Form ID: ${form_id}`,
            `Ad ID: ${ad_id || "N/A"}`,
            `Lead ID: ${leadgen_id}`,
            fields.city ? `City: ${fields.city}` : null,
            fields.state ? `State: ${fields.state}` : null,
            fields.zip_code ? `Zip: ${fields.zip_code}` : null,
            fields.job_title ? `Job Title: ${fields.job_title}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          createdById: owner.id,
        },
      });

      console.log(`[Meta Webhook] Lead created: ${newLead.id} — ${contactName} (${fields.email || "no email"})`);
    } catch (err) {
      console.error("[Meta Webhook] Error creating lead:", err.message);
    }
  }
}

export default new WebhookController();
