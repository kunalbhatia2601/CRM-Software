import {
  Database,
  FileBarChart,
  Globe,
  ListPlus,
  Mail,
  Phone,
  Receipt,
  RefreshCw,
  Send,
  Wrench,
} from "lucide-react";

/**
 * Display metadata for the assistant's tools, by name.
 *
 * The server is the source of truth for what a tool does (name, description,
 * kind) — this only supplies an icon and, where the server's label would be
 * too technical for a chat log, a friendlier one. Anything not listed here
 * still renders, just with a generic icon and its raw name.
 */
const TOOL_META = {
  describe_schema: { icon: Database, shortLabel: "Checked schema" },
  query_database: { icon: Database, shortLabel: "Queried CRM data" },
  run_report: { icon: FileBarChart, shortLabel: "Ran project report" },
  web_search: { icon: Globe, shortLabel: "Searched the web" },
  propose_create_task: { icon: ListPlus, shortLabel: "Drafted a task" },
  propose_create_follow_up: { icon: Phone, shortLabel: "Drafted a follow-up" },
  propose_update_status: { icon: RefreshCw, shortLabel: "Drafted a status change" },
  propose_log_expense: { icon: Receipt, shortLabel: "Drafted an expense" },
  propose_send_email: { icon: Mail, shortLabel: "Drafted an email" },
  propose_send_invoice: { icon: Send, shortLabel: "Drafted an invoice send" },
};

export function toolIcon(name) {
  return TOOL_META[name]?.icon || Wrench;
}

/** A short, past-tense line for one trace entry — "Queried CRM data", not the raw tool name. */
export function toolShortLabel(name) {
  return TOOL_META[name]?.shortLabel || name;
}

/** Turn one call's { summary, error } into the single line a trace row shows. */
export function callSummaryLine(call) {
  if (!call.ok) return call.error || "Failed";
  const s = call.summary;
  if (!s || typeof s !== "object") return null;
  const parts = [];
  if (typeof s.total === "number") parts.push(`${s.total} total`);
  else if (typeof s.rows === "number") parts.push(`${s.rows} row${s.rows === 1 ? "" : "s"}`);
  if (typeof s.groups === "number") parts.push(`${s.groups} group${s.groups === 1 ? "" : "s"}`);
  if (s.truncated) parts.push("truncated");
  if (s.result !== undefined) parts.push(String(s.result));
  return parts.length ? parts.join(" · ") : null;
}

export function formatMs(ms) {
  if (ms == null) return "";
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}
