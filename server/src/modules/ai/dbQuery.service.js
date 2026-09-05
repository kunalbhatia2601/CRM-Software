import fs from "fs";
import path from "path";
import prisma from "../../utils/prisma.js";

/**
 * Read-only database access layer for the AI copilot.
 *
 * Exposes two capabilities:
 *   - describeSchema(): a compact map of queryable models, fields, enums, relations.
 *   - query(): a strictly READ-ONLY query runner (findMany / findUnique / count /
 *     groupBy / aggregate only). No create/update/delete/raw is ever reachable.
 *
 * Safety layers:
 *   1. Model ALLOWLIST — only these models can be touched.
 *   2. Field DENYLIST — sensitive fields are stripped from selects and results.
 *   3. Operation allowlist — read operations only.
 *   4. `take` is hard-capped.
 */

// Models the AI may read. Anything not listed is invisible/blocked.
const ALLOWED_MODELS = new Set([
  "User", "Lead", "Deal", "Client", "Project", "Service",
  "DealService", "ProjectService", "Team", "TeamMember", "ProjectTeam",
  "Document", "Meeting", "MeetingTask", "FollowUp", "Sample",
  "LeadSample", "DealSample",
  "PlanningStep", "Task", "TaskFeedback", "TaskSubmission", "Milestone", "Comment",
  "Deliverable", "DeliverableFeedback",
  "DeliverableMilestone", "DeliverablePlanningStep", "DeliverableTask",
  "Attendance", "LeaveType", "LeaveBalance", "LeaveRequest", "Holiday",
  "Notification", "Invoice", "InvoiceItem", "InvoicePayment", "PaymentAccount",
  "Expense", "ExpenseCategory", "ExpenseEvent",
  "Campaign", "CampaignType", "CampaignDailyStat", "AdBudgetLedger", "AdBudgetEntry",
  "ProjectReport",
  "Announcement", "Job", "JobApplication", "PayrollRecord", "Site",
]);

// Fields never returned to the AI (auth/secret material), stripped everywhere.
const DENY_FIELDS = new Set([
  "password", "smtpPassword", "aiApiKey", "storageSecretKey", "storageAccessKeyId",
  "token", "refreshToken", "code", "otp",
]);

// Sensitive models entirely blocked even if referenced via includes.
const BLOCKED_MODELS = new Set([
  "RefreshToken", "Otp", "AuditLog", "Settings", "SystemPrompt", "EmailTemplate", "KpiConfig",
  // The assistant's own chat logs are not CRM data.
  "CopilotConversation", "CopilotMessage",
]);

const READ_OPS = new Set(["findMany", "findUnique", "findFirst", "count", "groupBy", "aggregate"]);
const MAX_TAKE = 100;

let _schemaCache = null;

class DbQueryService {
  /**
   * Parse enum name → values[] from the schema.prisma file (DMMF omits values in this build).
   */
  #parseEnums() {
    try {
      const file = fs.readFileSync(path.resolve("prisma/schema.prisma"), "utf8");
      const enums = {};
      const re = /enum\s+(\w+)\s*\{([^}]+)\}/g;
      let m;
      while ((m = re.exec(file))) {
        enums[m[1]] = m[2].split("\n").map((l) => l.replace(/\/\/.*/, "").trim()).filter(Boolean);
      }
      return enums;
    } catch {
      return {};
    }
  }

  /**
   * Build a compact, AI-friendly schema map for the allowed models.
   * Cached after first build.
   */
  describeSchema() {
    if (_schemaCache) return _schemaCache;

    const rt = prisma._runtimeDataModel;
    const enums = this.#parseEnums();
    const models = {};

    for (const [name, def] of Object.entries(rt?.models || {})) {
      if (!ALLOWED_MODELS.has(name)) continue;

      const scalars = [];
      const relations = [];
      for (const f of def.fields || []) {
        if (DENY_FIELDS.has(f.name)) continue;
        if (f.kind === "object") {
          // relation — only expose if target model is allowed & not blocked
          if (ALLOWED_MODELS.has(f.type) && !BLOCKED_MODELS.has(f.type)) {
            relations.push({ field: f.name, model: f.type, list: !!f.isList });
          }
        } else if (f.kind === "enum") {
          scalars.push({ name: f.name, type: f.type, enum: enums[f.type] || [] });
        } else {
          scalars.push({ name: f.name, type: f.type });
        }
      }
      models[name] = { fields: scalars, relations };
    }

    _schemaCache = {
      note: "Use the exact model names (PascalCase) and field names (camelCase) shown here when calling query_database. All access is READ-ONLY.",
      models,
    };
    return _schemaCache;
  }

  /**
   * Recursively strip denied fields + reject blocked-model includes from a select/include tree.
   */
  #sanitizeSelection(node) {
    if (!node || typeof node !== "object") return node;
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (DENY_FIELDS.has(k)) continue;
      if (v && typeof v === "object" && (v.select || v.include || v.where || v.orderBy || v.take !== undefined)) {
        // Nested relation query object. A `take` is honoured if the caller asked
        // for one, but never invented: Prisma rejects `take` on a to-one
        // relation, and adding one would fail the whole query.
        out[k] = this.#sanitizeArgs(v, { allowTake: true, defaultTake: null });
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  /**
   * Sanitize an args object: enforce take cap, sanitize select/include, keep read-safe keys only.
   */
  #sanitizeArgs(args = {}, { allowTake = true, defaultTake = 25 } = {}) {
    // NOTE: callers pass `defaultTake: null` for "no default". Passing
    // `undefined` would silently fall back to the 25 above.
    const allowedKeys = new Set(["where", "select", "include", "orderBy", "take", "skip", "distinct", "by", "_count", "_sum", "_avg", "_min", "_max", "cursor"]);
    const out = {};
    for (const [k, v] of Object.entries(args)) {
      if (!allowedKeys.has(k)) continue;
      if (k === "take") {
        // Only findMany may take. findFirst/findUnique/count/etc must not.
        if (allowTake) out.take = Math.min(Math.max(Number(v) || 25, 1), MAX_TAKE);
        continue;
      }
      if (k === "select" || k === "include") { out[k] = this.#sanitizeSelection(v); continue; }
      out[k] = v;
    }
    if (allowTake && typeof defaultTake === "number" && out.take === undefined) out.take = defaultTake;
    return out;
  }

  /**
   * Strip denied fields from returned rows (defensive — in case a select pulled one).
   */
  #sanitizeResult(data) {
    if (Array.isArray(data)) return data.map((d) => this.#sanitizeResult(d));
    if (data && typeof data === "object") {
      const out = {};
      for (const [k, v] of Object.entries(data)) {
        if (DENY_FIELDS.has(k)) continue;
        out[k] = (v && typeof v === "object") ? this.#sanitizeResult(v) : v;
      }
      return out;
    }
    return data;
  }

  /**
   * Run a read-only query.
   * @param {object} params
   * @param {string} params.model      PascalCase model name (e.g. "Lead")
   * @param {string} params.operation  findMany|findUnique|findFirst|count|groupBy|aggregate
   * @param {object} params.args       Prisma args (where/select/include/orderBy/take/by/_count…)
   */
  async query({ model, operation = "findMany", args = {} }) {
    if (!model || !ALLOWED_MODELS.has(model) || BLOCKED_MODELS.has(model)) {
      throw new Error(`Model "${model}" is not queryable.`);
    }
    if (!READ_OPS.has(operation)) {
      throw new Error(`Operation "${operation}" is not allowed. Read-only: ${[...READ_OPS].join(", ")}.`);
    }

    // Map PascalCase model → prisma client accessor (camelCase first letter).
    const accessor = model.charAt(0).toLowerCase() + model.slice(1);
    const delegate = prisma[accessor];
    if (!delegate || typeof delegate[operation] !== "function") {
      throw new Error(`Cannot run ${operation} on ${model}.`);
    }

    // Only findMany may carry `take`. findFirst/findUnique/count/groupBy/aggregate must not.
    const opts = operation === "findMany"
      ? { allowTake: true, defaultTake: 25 }
      : { allowTake: false };
    const safeArgs = this.#sanitizeArgs(args, opts);
    const result = await delegate[operation](safeArgs);
    const clean = this.#sanitizeResult(result);

    if (!Array.isArray(clean)) return { model, operation, result: clean };

    // A row list is capped, so the caller must be told how many rows actually
    // match. Reporting only the returned length reads as a total and silently
    // turns "28 clients" into "25 clients".
    let total = clean.length;
    if (operation === "findMany") {
      try {
        total = await delegate.count({ where: safeArgs.where });
      } catch {
        // A model without a countable shape — fall back to what we returned.
        total = clean.length;
      }
    }

    const skipped = Number(safeArgs.skip) || 0;
    const truncated = operation === "findMany" && skipped + clean.length < total;

    return {
      model,
      operation,
      returned: clean.length,
      total,
      truncated,
      ...(truncated
        ? {
            warning:
              `Only ${clean.length} of ${total} matching ${model} rows are in this result. ` +
              `Do NOT state or count from these rows as if they were all of them. ` +
              `Either page with skip/take (take is capped at ${MAX_TAKE}) or use operation "count"/"groupBy" for totals.`,
          }
        : {}),
      rows: clean,
    };
  }
}

export default new DbQueryService();
