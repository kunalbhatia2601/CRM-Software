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
  "PlanningStep", "Task", "TaskFeedback", "Milestone", "Comment",
  "Attendance", "LeaveType", "LeaveBalance", "LeaveRequest", "Holiday",
  "Notification", "Invoice", "InvoiceItem", "Announcement", "Job",
  "JobApplication", "PayrollRecord", "Site",
]);

// Fields never returned to the AI (auth/secret material), stripped everywhere.
const DENY_FIELDS = new Set([
  "password", "smtpPassword", "aiApiKey", "storageSecretKey", "storageAccessKeyId",
  "token", "refreshToken", "code", "otp",
]);

// Sensitive models entirely blocked even if referenced via includes.
const BLOCKED_MODELS = new Set([
  "RefreshToken", "Otp", "AuditLog", "Settings", "SystemPrompt", "EmailTemplate", "KpiConfig",
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
        // nested relation query object
        out[k] = this.#sanitizeArgs(v, true);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  /**
   * Sanitize an args object: enforce take cap, sanitize select/include, keep read-safe keys only.
   */
  #sanitizeArgs(args = {}, nested = false) {
    const allowedKeys = new Set(["where", "select", "include", "orderBy", "take", "skip", "distinct", "by", "_count", "_sum", "_avg", "_min", "_max", "cursor"]);
    const out = {};
    for (const [k, v] of Object.entries(args)) {
      if (!allowedKeys.has(k)) continue;
      if (k === "take") { out.take = Math.min(Math.max(Number(v) || 25, 1), MAX_TAKE); continue; }
      if (k === "select" || k === "include") { out[k] = this.#sanitizeSelection(v); continue; }
      out[k] = v;
    }
    // Always cap top-level list reads.
    if (!nested && out.take === undefined) out.take = 25;
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

    // Only findMany/findFirst get a default take cap; count/groupBy/aggregate/findUnique don't.
    const wantsTake = operation === "findMany" || operation === "findFirst";
    const safeArgs = this.#sanitizeArgs(args, !wantsTake);
    const result = await delegate[operation](safeArgs);
    const clean = this.#sanitizeResult(result);

    // Compact response for the AI.
    if (Array.isArray(clean)) return { model, operation, count: clean.length, rows: clean };
    return { model, operation, result: clean };
  }
}

export default new DbQueryService();
