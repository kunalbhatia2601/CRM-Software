/**
 * Report downloads.
 *
 * PDF goes through the browser's own print pipeline — it renders the page the
 * analyst is looking at, so what ships is exactly what was reviewed, overrides
 * included. Excel writes a real workbook with one sheet per section, mirroring
 * the client audit file so it drops straight into their existing process.
 */

import { MONTHS, resolve } from "./reportShape";

/** Money and percentages should read as numbers in Excel, not text. */
const FMT = {
  money: '#,##0.00',
  int: "#,##0",
  pct: '0.0"%"',
  date: "dd mmm yyyy",
};

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const date = (v) => (v ? new Date(v) : null);

/** Print to PDF. The @media print rules strip chrome down to the report itself. */
export function downloadReportPdf() {
  window.print();
}

/**
 * One workbook, one sheet per section.
 *
 * @param {{report: object, period: string}} payload
 */
export async function downloadReportExcel({ report, period }) {
  // Loaded on demand — the workbook writer is far too heavy for the page bundle.
  const ExcelJS = (await import("exceljs")).default;

  const snap = report.snapshot || {};
  const manual = (path) => resolve(report, path) || [];

  const fin = snap.finance || {};
  const dash = snap.dashboard || {};
  const info = snap.clientInfo || {};
  const delivery = snap.delivery || {};

  const wb = new ExcelJS.Workbook();
  wb.creator = "TaskGo Agency Suite";
  wb.created = new Date();

  /**
   * Add a sheet with a title row, a styled header row, and the data.
   *
   * @param {string} name sheet name (Excel caps these at 31 chars)
   * @param {{header:string,key:string,width?:number,fmt?:string}[]} columns
   * @param {object[]} rows
   */
  function sheet(name, columns, rows) {
    const ws = wb.addWorksheet(name.slice(0, 31), {
      views: [{ state: "frozen", ySplit: 3 }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    });

    // Title band across the sheet.
    ws.mergeCells(1, 1, 1, Math.max(columns.length, 1));
    const title = ws.getCell(1, 1);
    title.value = `${report.project?.name || "Report"} — ${name} — ${period}`;
    title.font = { bold: true, size: 12, color: { argb: "FF1E293B" } };
    ws.getRow(2).height = 6;

    const headerRow = ws.getRow(3);
    columns.forEach((c, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5542F6" } };
      cell.alignment = { vertical: "middle", wrapText: true };
      ws.getColumn(i + 1).width = c.width || 18;
    });
    headerRow.height = 20;

    for (const row of rows) {
      const r = ws.addRow(columns.map((c) => row[c.key] ?? null));
      columns.forEach((c, i) => {
        if (c.fmt) r.getCell(i + 1).numFmt = c.fmt;
        r.getCell(i + 1).alignment = { vertical: "top", wrapText: c.wrap || false };
      });
    }

    if (rows.length > 0) {
      ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: columns.length } };
    }
    return ws;
  }

  /** A two-column label/value sheet. */
  function kvSheet(name, pairs) {
    sheet(
      name,
      [
        { header: "Field", key: "k", width: 34 },
        { header: "Value", key: "v", width: 40, wrap: true },
      ],
      pairs.map(([k, v]) => ({ k, v: v ?? "—" }))
    );
  }

  // ── 01 Client info ──
  kvSheet("01_Client_Info", [
    ["Client Name", info.clientName],
    ["Contact Person", info.contactName],
    ["Industry", info.industry],
    ["Account Manager", info.accountManager],
    ["Platforms", (info.platforms || []).join(", ")],
    ["Package Type", info.packageType],
    ["Reporting Month", info.reportingMonth],
    ["Project", info.projectName],
    ["Project Status", snap.project?.status?.replace(/_/g, " ")],
    ["Report Status", report.status],
  ]);

  // ── 02 Dashboard ──
  sheet(
    "02_Dashboard",
    [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 20, fmt: FMT.int },
    ],
    [
      { metric: "Total Content Pieces", value: num(dash.totalContentPieces) },
      { metric: "Total Reach", value: num(dash.totalReach) },
      { metric: "Total Impressions", value: num(dash.totalImpressions) },
      { metric: "Total Engagement", value: num(dash.totalEngagement) },
      { metric: "Avg Engagement Rate %", value: num(dash.avgEngagementRate) },
      { metric: "Total Ad Spend", value: num(dash.adSpend) },
      { metric: "Total Leads (Ads)", value: num(dash.adLeads) },
      { metric: "Cost Per Lead", value: num(dash.costPerLead) },
      { metric: "Best Performing Content", value: dash.bestContent?.campaign || "—" },
    ]
  );

  // ── 03 Content log ──
  sheet(
    "03_Content_Log",
    [
      { header: "Date", key: "date", width: 14, fmt: FMT.date },
      { header: "Campaign", key: "campaign", width: 28, wrap: true },
      { header: "Content ID", key: "contentId", width: 16 },
      { header: "Type", key: "type", width: 14 },
      { header: "Reach", key: "reach", width: 12, fmt: FMT.int },
      { header: "Likes", key: "likes", width: 10, fmt: FMT.int },
      { header: "Comments", key: "comments", width: 12, fmt: FMT.int },
      { header: "Saves", key: "saves", width: 10, fmt: FMT.int },
      { header: "Shares", key: "shares", width: 10, fmt: FMT.int },
      { header: "Engagement", key: "engagement", width: 14, fmt: FMT.int },
      { header: "Engagement Rate %", key: "engagementRate", width: 18, fmt: FMT.pct },
    ],
    (snap.contentPerformance?.rows || []).map((r) => ({ ...r, date: date(r.date) }))
  );

  // ── 04 Content performance by type ──
  sheet(
    "04_Content_Performance",
    [
      { header: "Type", key: "type", width: 18 },
      { header: "Count", key: "count", width: 12, fmt: FMT.int },
      { header: "Total Reach", key: "reach", width: 16, fmt: FMT.int },
      { header: "Total Engagement", key: "engagement", width: 18, fmt: FMT.int },
      { header: "Engagement Rate %", key: "rate", width: 18, fmt: FMT.pct },
    ],
    (snap.contentPerformance?.buckets || []).map((b) => ({
      ...b,
      rate: b.reach > 0 ? Math.round((b.engagement / b.reach) * 1000) / 10 : null,
    }))
  );

  // ── 05 Growth metrics (hand-entered) ──
  sheet(
    "05_Growth_Metrics",
    [
      { header: "Metric", key: "metric", width: 24 },
      { header: "Start", key: "start", width: 14, fmt: FMT.int },
      { header: "End", key: "end", width: 14, fmt: FMT.int },
      { header: "Growth %", key: "growth", width: 14, fmt: FMT.pct },
      { header: "Notes", key: "notes", width: 40, wrap: true },
    ],
    manual("growthMetrics").map((g) => ({
      ...g, start: num(g.start), end: num(g.end), growth: num(g.growth),
    }))
  );

  // ── 06 Ads ──
  sheet(
    "06_Ads_Data",
    [
      { header: "Campaign", key: "campaign", width: 28, wrap: true },
      { header: "Objective", key: "objective", width: 18 },
      { header: "Platform", key: "platform", width: 14 },
      { header: "Date Range", key: "dateRange", width: 22 },
      { header: "Spend", key: "spend", width: 14, fmt: FMT.money },
      { header: "Reach", key: "reach", width: 14, fmt: FMT.int },
      { header: "Clicks", key: "clicks", width: 12, fmt: FMT.int },
      { header: "CTR %", key: "ctr", width: 10, fmt: FMT.pct },
      { header: "Leads", key: "leads", width: 10, fmt: FMT.int },
      { header: "CPL", key: "cpl", width: 14, fmt: FMT.money },
      { header: "Won Deals", key: "won", width: 12, fmt: FMT.int },
      { header: "Revenue", key: "revenue", width: 16, fmt: FMT.money },
      { header: "Status", key: "status", width: 14 },
    ],
    (snap.ads?.rows || []).map((a) => ({
      ...a, spend: num(a.spend), cpl: num(a.cpl), revenue: num(a.revenue),
    }))
  );

  // ── 07 Invoices ──
  sheet(
    "07_Invoices",
    [
      { header: "Invoice No", key: "invoiceNumber", width: 20 },
      { header: "Issued", key: "issueDate", width: 15, fmt: FMT.date },
      { header: "Due", key: "dueDate", width: 15, fmt: FMT.date },
      { header: "Status", key: "status", width: 14 },
      { header: "Total", key: "total", width: 16, fmt: FMT.money },
      { header: "Paid", key: "amountPaid", width: 16, fmt: FMT.money },
      { header: "Outstanding", key: "due", width: 16, fmt: FMT.money },
    ],
    (fin.invoices || []).map((i) => ({
      ...i, issueDate: date(i.issueDate), dueDate: date(i.dueDate),
    }))
  );

  // ── 08 Payments ──
  sheet(
    "08_Payments",
    [
      { header: "Date", key: "paidAt", width: 15, fmt: FMT.date },
      { header: "Invoice No", key: "invoiceNumber", width: 20 },
      { header: "Method", key: "method", width: 16 },
      { header: "Reference / UTR", key: "referenceNo", width: 26 },
      { header: "Amount", key: "amount", width: 16, fmt: FMT.money },
    ],
    (fin.payments || []).map((p) => ({
      ...p, paidAt: date(p.paidAt), method: p.method?.replace(/_/g, " "),
    }))
  );

  // ── 09 Expenses ──
  sheet(
    "09_Expenses",
    [
      { header: "Date", key: "expenseDate", width: 15, fmt: FMT.date },
      { header: "Reference", key: "reference", width: 18 },
      { header: "Title", key: "title", width: 30, wrap: true },
      { header: "Category", key: "category", width: 20 },
      { header: "Billable", key: "billable", width: 12 },
      { header: "Amount", key: "totalAmount", width: 16, fmt: FMT.money },
    ],
    (fin.expenses || []).map((e) => ({
      ...e,
      expenseDate: date(e.expenseDate),
      category: e.category?.name || "—",
      billable: e.isBillable ? "Yes" : "No",
    }))
  );

  // ── 10 Task costs ──
  sheet(
    "10_Task_Costs",
    [
      { header: "Task", key: "title", width: 40, wrap: true },
      { header: "Assignee", key: "assignee", width: 22 },
      { header: "Hours", key: "hours", width: 12, fmt: "0.0" },
      { header: "Cost", key: "cost", width: 16, fmt: FMT.money },
    ],
    fin.topTaskCosts || []
  );

  // ── 11 P&L ──
  sheet(
    "11_PnL",
    [
      { header: "Line", key: "line", width: 30 },
      { header: "Amount", key: "amount", width: 18, fmt: FMT.money },
    ],
    [
      { line: "Billed this month", amount: num(fin.billed) },
      { line: "Received (cash in)", amount: num(fin.received) },
      { line: "Outstanding", amount: num(fin.outstanding) },
      { line: "Cost — expenses", amount: num(fin.cost?.expenses) },
      { line: "Cost — team time", amount: num(fin.cost?.taskCost) },
      { line: "Cost — ad spend", amount: num(fin.cost?.adSpend) },
      { line: "Cost — total", amount: num(fin.cost?.total) },
      { line: "Realised P/L (received − cost)", amount: num(fin.profit?.realised) },
      { line: "Realised margin %", amount: num(fin.profit?.realisedMargin) },
      { line: "Billed P/L (billed − cost)", amount: num(fin.profit?.billedProfit) },
      { line: "Billed margin %", amount: num(fin.profit?.billedMargin) },
    ]
  );

  // ── 12 Delivery ──
  sheet(
    "12_Delivery",
    [
      { header: "Metric", key: "metric", width: 34 },
      { header: "Value", key: "value", width: 18 },
    ],
    [
      { metric: "Tasks completed this month", value: num(delivery.tasks?.completedThisMonth) },
      { metric: "Tasks completed (all time)", value: num(delivery.tasks?.completed) },
      { metric: "Tasks open", value: num(delivery.tasks?.open) },
      { metric: "Tasks overdue", value: num(delivery.tasks?.overdue) },
      { metric: "Planning steps completed", value: `${delivery.steps?.completed ?? 0}/${delivery.steps?.total ?? 0}` },
      { metric: "Deliverables", value: num(delivery.deliverables?.length) },
    ]
  );

  sheet(
    "13_Milestones",
    [
      { header: "Milestone", key: "title", width: 40, wrap: true },
      { header: "Due", key: "dueDate", width: 15, fmt: FMT.date },
      { header: "Status", key: "status", width: 18 },
    ],
    (delivery.milestones || []).map((m) => ({ ...m, dueDate: date(m.dueDate) }))
  );

  sheet(
    "14_Deliverables",
    [
      { header: "Deliverable", key: "title", width: 40, wrap: true },
      { header: "Status", key: "status", width: 20 },
      { header: "Published", key: "publishedAt", width: 15, fmt: FMT.date },
      { header: "Approvals", key: "approvals", width: 12, fmt: FMT.int },
      { header: "Revisions", key: "revisions", width: 12, fmt: FMT.int },
    ],
    (delivery.deliverables || []).map((d) => ({ ...d, publishedAt: date(d.publishedAt) }))
  );

  // ── 15 Audit score (hand-entered) ──
  sheet(
    "15_Audit_Score",
    [
      { header: "Area", key: "area", width: 26 },
      { header: "Score (1-10)", key: "score", width: 14, fmt: FMT.int },
      { header: "What went well", key: "wentWell", width: 38, wrap: true },
      { header: "What needs improvement", key: "needsImprovement", width: 38, wrap: true },
      { header: "Owner", key: "owner", width: 20 },
    ],
    manual("auditScore").map((a) => ({ ...a, score: num(a.score) }))
  );

  // ── 16 Issues (hand-entered) ──
  sheet(
    "16_Issues_Log",
    [
      { header: "Date", key: "date", width: 15, fmt: FMT.date },
      { header: "Issue", key: "issue", width: 34, wrap: true },
      { header: "Impact", key: "impact", width: 28, wrap: true },
      { header: "Action Taken", key: "actionTaken", width: 34, wrap: true },
      { header: "Owner", key: "owner", width: 20 },
      { header: "Status", key: "status", width: 16 },
      { header: "Notes", key: "notes", width: 30, wrap: true },
    ],
    manual("issues").map((i) => ({ ...i, date: date(i.date) }))
  );

  // ── 17 Next month plan (hand-entered) ──
  sheet(
    "17_Next_Month_Plan",
    [
      { header: "Focus Area", key: "focusArea", width: 24 },
      { header: "Action / Change", key: "action", width: 36, wrap: true },
      { header: "Reason (Data-backed)", key: "reason", width: 36, wrap: true },
      { header: "Owner", key: "owner", width: 20 },
      { header: "Due Date", key: "dueDate", width: 15, fmt: FMT.date },
      { header: "Expected Outcome", key: "expectedOutcome", width: 34, wrap: true },
    ],
    manual("nextMonthPlan").map((p) => ({ ...p, dueDate: date(p.dueDate) }))
  );

  // ── 18 Summary ──
  const ws = sheet("18_Summary", [{ header: "Account Summary", key: "text", width: 110, wrap: true }], []);
  const cell = ws.addRow([report.summary || "No summary written."]).getCell(1);
  cell.alignment = { wrapText: true, vertical: "top" };

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const name = `${report.project?.name || "report"}-${MONTHS[report.periodMonth - 1]}-${report.periodYear}`
    .replace(/[^a-z0-9]+/gi, "-");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
