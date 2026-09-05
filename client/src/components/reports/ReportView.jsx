"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, BarChart3, TrendingUp, Megaphone, Wallet, ListChecks,
  ClipboardCheck, AlertTriangle, CalendarClock, Pencil, Save, X, Download,
  Lock, Unlock, Loader2, ReceiptText, FileText, FileSpreadsheet, LayoutDashboard,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import Badge from "@/components/ui/Badge";
import Toast from "@/components/ui/Toast";
import { updateReport, clearReportOverride } from "@/actions/reports.action";
import { MONTHS, resolve, isOverridden, fmtDate, fmtNum, fmtPct } from "./reportShape";
import {
  Section, Tile, Empty, Table, Td, EditableGrid, OverrideBadge,
} from "./ReportSections";
import { downloadReportPdf, downloadReportExcel } from "./reportDownload";

/* Column definitions for the hand-entered sections. */
const GROWTH_COLS = [
  { key: "metric", label: "Metric", width: "180px" },
  { key: "start", label: "Start", type: "number", width: "110px" },
  { key: "end", label: "End", type: "number", width: "110px" },
  { key: "growth", label: "Growth %", type: "percent", width: "110px" },
  { key: "notes", label: "Notes", width: "260px" },
];

const AUDIT_COLS = [
  { key: "area", label: "Area", width: "180px" },
  { key: "score", label: "Score (1-10)", type: "number", width: "110px" },
  { key: "wentWell", label: "What went well", width: "240px" },
  { key: "needsImprovement", label: "What needs improvement", width: "240px" },
  { key: "owner", label: "Owner", width: "140px" },
];

const ISSUE_COLS = [
  { key: "date", label: "Date", type: "date", width: "150px" },
  { key: "issue", label: "Issue", width: "220px" },
  { key: "impact", label: "Impact", width: "180px" },
  { key: "actionTaken", label: "Action taken", width: "220px" },
  { key: "owner", label: "Owner", width: "140px" },
  { key: "status", label: "Status", width: "120px" },
  { key: "notes", label: "Notes", width: "200px" },
];

const PLAN_COLS = [
  { key: "focusArea", label: "Focus area", width: "180px" },
  { key: "action", label: "Action / change", width: "240px" },
  { key: "reason", label: "Reason (data-backed)", width: "240px" },
  { key: "owner", label: "Owner", width: "140px" },
  { key: "dueDate", label: "Due date", type: "date", width: "150px" },
  { key: "expectedOutcome", label: "Expected outcome", width: "220px" },
];

/** Sections whose whole array can be replaced by hand. */
const MANUAL_SECTIONS = [
  { path: "growthMetrics", title: "Growth metrics", icon: TrendingUp, cols: GROWTH_COLS,
    subtitle: "Follower and traffic movement across the month." },
  { path: "auditScore", title: "Audit score", icon: ClipboardCheck, cols: AUDIT_COLS,
    subtitle: "Scored 1-10 by the account team." },
  { path: "issues", title: "Issues log", icon: AlertTriangle, cols: ISSUE_COLS,
    subtitle: "What went wrong and what was done about it." },
  { path: "nextMonthPlan", title: "Next month plan", icon: CalendarClock, cols: PLAN_COLS,
    subtitle: "Data-backed changes for the coming month." },
];

/**
 * The report reads as one document but is long, so it is split into tabs.
 * Printing ignores the active tab and lays every section out in order.
 */
const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "content", label: "Content", icon: BarChart3 },
  { id: "ads", label: "Ads", icon: Megaphone },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "delivery", label: "Delivery", icon: ListChecks },
  { id: "audit", label: "Audit & Plan", icon: ClipboardCheck },
];

/**
 * One tab's panel. Hidden tabs stay mounted so edits in them survive a tab
 * switch, and `print:block` brings every panel back for the PDF.
 */
function Panel({ active, children }) {
  return (
    <div className={`space-y-6 ${active ? "" : "hidden print:block print:mt-6"}`}>{children}</div>
  );
}

export default function ReportView({ initial, basePath = "/owner" }) {
  const { format } = useSite();
  const money = (n) => format(Number(n) || 0, { decimals: 0 });

  const [report, setReport] = useState(initial);
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [summary, setSummary] = useState(initial.summary || "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);

  const snap = report.snapshot || {};
  const isFinal = report.status === "FINAL";

  /** Editing reads from the draft; viewing reads through the override layer. */
  const val = (path) =>
    editing && Object.prototype.hasOwnProperty.call(draft, path) ? draft[path] : resolve(report, path);

  const period = `${MONTHS[report.periodMonth - 1]} ${report.periodYear}`;

  function startEditing() {
    setDraft({});
    setSummary(report.summary || "");
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    const res = await updateReport(report.id, { overrides: draft, summary });
    setSaving(false);
    if (!res.success) return setToast({ type: "error", message: res.error });

    setReport(res.data);
    setDraft({});
    setEditing(false);
    setToast({ type: "success", message: "Report saved" });
  }

  async function revert(path) {
    const res = await clearReportOverride(report.id, path);
    if (!res.success) return setToast({ type: "error", message: res.error });
    setReport(res.data);
    setDraft((d) => {
      const next = { ...d };
      delete next[path];
      return next;
    });
  }

  async function toggleFinal() {
    const next = isFinal ? "DRAFT" : "FINAL";
    const res = await updateReport(report.id, { status: next });
    if (!res.success) return setToast({ type: "error", message: res.error });
    setReport(res.data);
    setToast({ type: "success", message: next === "FINAL" ? "Report locked" : "Report reopened" });
  }

  const dash = snap.dashboard || {};
  const fin = snap.finance || {};
  const delivery = snap.delivery || {};
  const info = snap.clientInfo || {};
  const ads = snap.ads || {};
  const content = snap.contentPerformance || {};

  const profitTone = (fin.profit?.realised ?? 0) >= 0 ? "emerald" : "red";

  /** The workbook writer is a lazy import, so this can take a beat. */
  async function exportExcel() {
    setExporting(true);
    try {
      await downloadReportExcel({ report, period });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Could not build the workbook" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 print:p-0">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`${basePath}/reports`}
            className="text-xs text-slate-500 hover:text-[#5542F6] flex items-center gap-1 mb-2 print:hidden"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All reports
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {report.project?.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {info.clientName || report.project?.client?.companyName} · {period} ·{" "}
            <Badge value={report.status} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setDraft({}); }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-[#5542F6] text-white text-sm font-semibold hover:bg-[#4535d9] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEditing}
                disabled={isFinal}
                title={isFinal ? "Reopen the report to edit it" : "Overwrite any value by hand"}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-40 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Manual overwrite
              </button>
              <button
                onClick={toggleFinal}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center gap-2"
              >
                {isFinal ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isFinal ? "Reopen" : "Mark final"}
              </button>
              <button
                onClick={exportExcel}
                disabled={exporting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Excel
              </button>
              <button
                onClick={() => downloadReportPdf()}
                className="px-4 py-2 rounded-xl bg-[#5542F6] text-white text-sm font-semibold hover:bg-[#4535d9] flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 print:hidden">
          Manual overwrite is on. Auto-pulled figures are kept underneath — a value you change is marked
          <span className="font-semibold"> Manual</span> and can be reverted any time.
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 print:hidden">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
                tab === id
                  ? "border-[#5542F6] text-[#5542F6]"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <Panel active={tab === "overview"}>
        {/* Headline numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tile label="Total reach" value={fmtNum(dash.totalReach)} sub={`${fmtNum(dash.totalContentPieces)} pieces`} />
          <Tile label="Avg engagement rate" value={fmtPct(dash.avgEngagementRate)} sub={`${fmtNum(dash.totalEngagement)} interactions`} />
          <Tile label="Ad spend" value={money(dash.adSpend)} sub={`${fmtNum(dash.adLeads)} leads`} tone="amber" />
          <Tile
            label="Cost per lead"
            value={dash.costPerLead ? money(dash.costPerLead) : "—"}
            sub="paid campaigns"
            tone="indigo"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Tile label="Billed this month" value={money(fin.billed)} sub={`${fin.invoices?.length || 0} invoices`} />
          <Tile label="Received" value={money(fin.received)} sub={`${fin.payments?.length || 0} payments`} tone="emerald" />
          <Tile label="Delivery cost" value={money(fin.cost?.total)} sub="expenses + team + ads" tone="amber" />
          <Tile
            label="Realised profit"
            value={money(fin.profit?.realised)}
            sub={fin.profit?.realisedMargin !== null ? `${fmtPct(fin.profit?.realisedMargin)} margin` : "no cash in"}
            tone={profitTone}
          />
        </div>

        {/* 01 — Client info */}
        <Section title="Client information" icon={Building2}>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
            {[
              ["Client", info.clientName],
              ["Contact", info.contactName],
              ["Industry", info.industry],
              ["Account manager", info.accountManager],
              ["Package type", info.packageType],
              ["Platforms", info.platforms?.length ? info.platforms.join(", ") : null],
              ["Reporting month", info.reportingMonth],
              ["Project status", snap.project?.status?.replace(/_/g, " ")],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500 dark:text-slate-400">{k}</dt>
                <dd className="text-slate-900 dark:text-slate-50 mt-0.5">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* Summary */}
        <Section title="Account summary" subtitle="The narrative that goes to the client." icon={FileText}>
          {editing ? (
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={6}
              placeholder="What worked, what did not, and what changes next month…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5542F6]/30"
            />
          ) : report.summary ? (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {report.summary}
            </p>
          ) : (
            <Empty>No summary written yet.</Empty>
          )}
        </Section>

      </Panel>

      <Panel active={tab === "content"}>
        {/* 03 — Content performance */}
        <Section
          title="Content performance"
          subtitle="Every daily entry logged against this project's campaigns."
          icon={BarChart3}
        >
          {content.buckets?.some((b) => b.count > 0) ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                {content.buckets.filter((b) => b.count > 0).map((b) => (
                  <div key={b.type} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-50">{b.type}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-1">{fmtNum(b.reach)}</p>
                    <p className="text-[11px] text-slate-400">
                      {b.count} posts · {fmtNum(b.engagement)} eng.
                    </p>
                  </div>
                ))}
              </div>

              <Table head={["Date", "Campaign", "Type", "Reach", "Likes", "Comments", "Saves", "Shares", "Engagement", "Rate"]}>
                {content.rows.map((r, i) => (
                  <tr key={i}>
                    <Td>{fmtDate(r.date)}</Td>
                    <Td className="whitespace-normal">{r.campaign}</Td>
                    <Td>{r.type}</Td>
                    <Td className="tabular-nums">{fmtNum(r.reach)}</Td>
                    <Td className="tabular-nums">{fmtNum(r.likes)}</Td>
                    <Td className="tabular-nums">{fmtNum(r.comments)}</Td>
                    <Td className="tabular-nums">{fmtNum(r.saves)}</Td>
                    <Td className="tabular-nums">{fmtNum(r.shares)}</Td>
                    <Td className="tabular-nums">{fmtNum(r.engagement)}</Td>
                    <Td className="tabular-nums">{fmtPct(r.engagementRate)}</Td>
                  </tr>
                ))}
              </Table>

              {dash.bestContent && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                  Best performing: <span className="font-medium text-slate-900 dark:text-slate-50">
                    {dash.bestContent.campaign}
                  </span>{" "}
                  on {fmtDate(dash.bestContent.date)} — {fmtPct(dash.bestContent.engagementRate)} engagement rate.
                </p>
              )}
            </>
          ) : (
            <Empty>No daily campaign stats logged for this month.</Empty>
          )}
        </Section>

      </Panel>

      <Panel active={tab === "ads"}>
        {/* 05 — Ads */}
        <Section title="Ads performance" subtitle="Paid campaigns and what they returned." icon={Megaphone}>
          {ads.rows?.length ? (
            <Table head={["Campaign", "Objective", "Platform", "Dates", "Spend", "Reach", "Clicks", "CTR", "Leads", "CPL", "Won", "Revenue", "Status"]}>
              {ads.rows.map((r) => (
                <tr key={r.reference}>
                  <Td className="whitespace-normal font-medium">{r.campaign}</Td>
                  <Td>{r.objective || "—"}</Td>
                  <Td>{r.platform || "—"}</Td>
                  <Td>{r.dateRange || "—"}</Td>
                  <Td className="tabular-nums">{money(r.spend)}</Td>
                  <Td className="tabular-nums">{fmtNum(r.reach)}</Td>
                  <Td className="tabular-nums">{fmtNum(r.clicks)}</Td>
                  <Td className="tabular-nums">{fmtPct(r.ctr)}</Td>
                  <Td className="tabular-nums">{fmtNum(r.leads)}</Td>
                  <Td className="tabular-nums">{r.cpl ? money(r.cpl) : "—"}</Td>
                  <Td className="tabular-nums">{fmtNum(r.won)}</Td>
                  <Td className="tabular-nums">{money(r.revenue)}</Td>
                  <Td><Badge value={r.status} /></Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No campaigns ran for this project.</Empty>
          )}
        </Section>

      </Panel>

      <Panel active={tab === "finance"}>
        {/* Money — the half the spreadsheet never had */}
        <Section title="Invoices" subtitle="Raised during this month." icon={ReceiptText}>
          {fin.invoices?.length ? (
            <Table head={["Invoice", "Issued", "Due", "Status", "Total", "Paid", "Outstanding"]}>
              {fin.invoices.map((i) => (
                <tr key={i.id}>
                  <Td className="font-medium">{i.invoiceNumber}</Td>
                  <Td>{fmtDate(i.issueDate)}</Td>
                  <Td>{fmtDate(i.dueDate)}</Td>
                  <Td><Badge value={i.status} /></Td>
                  <Td className="tabular-nums">{money(i.total)}</Td>
                  <Td className="tabular-nums text-emerald-600">{money(i.amountPaid)}</Td>
                  <Td className={`tabular-nums ${i.due > 0 ? "text-red-600" : "text-slate-400"}`}>{money(i.due)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No invoices raised this month.</Empty>
          )}
        </Section>

        <Section title="Payments received" subtitle="Cash that actually landed, with transaction references." icon={Wallet}>
          {fin.payments?.length ? (
            <Table head={["Date", "Invoice", "Method", "Reference", "Amount"]}>
              {fin.payments.map((p) => (
                <tr key={p.id}>
                  <Td>{fmtDate(p.paidAt)}</Td>
                  <Td className="font-medium">{p.invoiceNumber}</Td>
                  <Td>{p.method?.replace(/_/g, " ")}</Td>
                  <Td className="font-mono text-xs">{p.referenceNo || "—"}</Td>
                  <Td className="tabular-nums text-emerald-600 font-medium">{money(p.amount)}</Td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty>No payments received this month.</Empty>
          )}
        </Section>

        <Section title="Cost of delivery" subtitle="Every rupee this project consumed in the month." icon={Wallet}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <Tile label="Expenses" value={money(fin.cost?.expenses)} />
            <Tile label="Team time" value={money(fin.cost?.taskCost)} />
            <Tile label="Ad spend" value={money(fin.cost?.adSpend)} />
            <Tile label="Total cost" value={money(fin.cost?.total)} tone="amber" />
          </div>

          {fin.expenses?.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Expenses</h3>
              <Table head={["Date", "Reference", "Title", "Category", "Billable", "Amount"]}>
                {fin.expenses.map((e) => (
                  <tr key={e.id}>
                    <Td>{fmtDate(e.expenseDate)}</Td>
                    <Td className="font-mono text-xs">{e.reference}</Td>
                    <Td className="whitespace-normal">{e.title}</Td>
                    <Td>{e.category?.name || "—"}</Td>
                    <Td>{e.isBillable ? "Yes" : "No"}</Td>
                    <Td className="tabular-nums">{money(e.totalAmount)}</Td>
                  </tr>
                ))}
              </Table>
            </>
          )}

          {fin.topTaskCosts?.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-6 mb-2">
                Costliest tasks completed
              </h3>
              <Table head={["Task", "Assignee", "Hours", "Cost"]}>
                {fin.topTaskCosts.map((t, i) => (
                  <tr key={i}>
                    <Td className="whitespace-normal">{t.title}</Td>
                    <Td>{t.assignee || "—"}</Td>
                    <Td className="tabular-nums">{t.hours}</Td>
                    <Td className="tabular-nums">{money(t.cost)}</Td>
                  </tr>
                ))}
              </Table>
            </>
          )}
        </Section>

        <Section title="Profit and loss" subtitle="Read against cash collected, and against everything billed." icon={TrendingUp}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tile label="Received" value={money(fin.received)} tone="emerald" />
            <Tile label="Cost" value={money(fin.cost?.total)} tone="amber" />
            <Tile label="Realised P/L" value={money(fin.profit?.realised)} sub={fmtPct(fin.profit?.realisedMargin)} tone={profitTone} />
            <Tile
              label="Billed P/L"
              value={money(fin.profit?.billedProfit)}
              sub={fmtPct(fin.profit?.billedMargin)}
              tone={(fin.profit?.billedProfit ?? 0) >= 0 ? "emerald" : "red"}
            />
          </div>
          {fin.outstanding > 0 && (
            <p className="text-xs text-amber-600 mt-4">
              {money(fin.outstanding)} still outstanding across this month's invoices.
            </p>
          )}
        </Section>

      </Panel>

      <Panel active={tab === "delivery"}>
        {/* Delivery */}
        <Section title="Delivery progress" subtitle="What the team shipped." icon={ListChecks}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
            <Tile label="Completed this month" value={fmtNum(delivery.tasks?.completedThisMonth)} tone="emerald" />
            <Tile label="Open tasks" value={fmtNum(delivery.tasks?.open)} />
            <Tile label="Overdue" value={fmtNum(delivery.tasks?.overdue)} tone="red" />
            <Tile label="Planning steps" value={`${delivery.steps?.completed ?? 0}/${delivery.steps?.total ?? 0}`} />
            <Tile label="Deliverables" value={fmtNum(delivery.deliverables?.length)} />
          </div>

          {delivery.milestones?.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Milestones</h3>
              <Table head={["Milestone", "Due", "Status"]}>
                {delivery.milestones.map((m) => (
                  <tr key={m.id}>
                    <Td className="whitespace-normal">{m.title}</Td>
                    <Td>{fmtDate(m.dueDate)}</Td>
                    <Td><Badge value={m.status} /></Td>
                  </tr>
                ))}
              </Table>
            </>
          )}

          {delivery.deliverables?.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-6 mb-2">Deliverables</h3>
              <Table head={["Deliverable", "Status", "Published", "Approvals", "Revisions"]}>
                {delivery.deliverables.map((d, i) => (
                  <tr key={i}>
                    <Td className="whitespace-normal">{d.title}</Td>
                    <Td><Badge value={d.status} /></Td>
                    <Td>{d.published ? fmtDate(d.publishedAt) : "No"}</Td>
                    <Td className="tabular-nums">{d.approvals}</Td>
                    <Td className="tabular-nums">{d.revisions}</Td>
                  </tr>
                ))}
              </Table>
            </>
          )}
        </Section>

      </Panel>

      <Panel active={tab === "audit"}>
        {/* Hand-entered sections */}
        {MANUAL_SECTIONS.map(({ path, title, subtitle, icon, cols }) => (
          <Section
            key={path}
            title={title}
            subtitle={subtitle}
            icon={icon}
            right={<OverrideBadge on={isOverridden(report, path)} onRevert={() => revert(path)} />}
          >
            <EditableGrid
              columns={cols}
              rows={val(path) || []}
              editing={editing}
              onChange={(rows) => setDraft((d) => ({ ...d, [path]: rows }))}
            />
          </Section>
        ))}

      </Panel>

      <p className="text-xs text-slate-400 text-center">
        Generated {fmtDate(report.generatedAt)}
        {report.generatedBy ? ` by ${report.generatedBy.firstName} ${report.generatedBy.lastName}` : ""}.
      </p>
    </div>
  );
}
