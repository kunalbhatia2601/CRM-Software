import fs from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";

/**
 * Invoice → PDF.
 *
 * Mirrors the on-screen invoice: A4, 12mm margins, the configured watermark on
 * every page, line items, totals, payment details and notes/terms.
 *
 * Rendered with pdfkit rather than a headless browser so the server needs no
 * Chromium and no system libraries.
 */

/** A4 in points, and the same 12mm margin the print stylesheet uses. */
const PAGE = { width: 595.28, height: 841.89, margin: 34 };

const INK = {
  heading: "#0f172a",
  body: "#334155",
  muted: "#94a3b8",
  line: "#e2e8f0",
  hairline: "#f1f5f9",
};

/**
 * Money for the PDF.
 *
 * The currency code is spelled out instead of using a symbol: pdfkit's built-in
 * Helvetica has no rupee glyph, and an unrenderable symbol would come out blank
 * on the one document where the amount has to be unambiguous.
 */
function money(amount, currency = "INR") {
  const n = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${currency} ${formatted}`;
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/**
 * Fetch a remote asset for embedding. Returns null on any failure — a missing
 * logo or watermark must never stop an invoice going out.
 */
async function fetchImage(url) {
  if (!url) return null;

  // pdfkit only understands JPEG and PNG.
  const isSupported = (type, u) =>
    /(jpeg|jpg|png)/i.test(type || "") || /\.(jpe?g|png)(\?|$)/i.test(u);

  try {
    // Locally stored uploads are served by this very process. Fetching them over
    // HTTP would mean the server calling itself — which breaks behind a proxy,
    // on a different port, or with a self-signed certificate. Read the file.
    const localMatch = url.match(/\/public\/(uploads\/.+)$/);
    if (localMatch) {
      const rel = decodeURIComponent(localMatch[1]);
      // Refuse anything that climbs out of the uploads directory.
      const base = path.resolve("public/uploads");
      const full = path.resolve("public", rel);
      if (!full.startsWith(base + path.sep)) return null;
      if (!isSupported("", full)) return null;

      return await fs.readFile(full);
    }

    const res = await fetch(url);
    if (!res.ok) return null;
    if (!isSupported(res.headers.get("content-type"), url)) return null;

    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Build the PDF and resolve with a Buffer.
 *
 * @param {object} invoice with items, paymentDetails, project, client
 * @param {object} opts { siteName, siteAddress, siteEmail, sitePhone, logo, watermark, watermarkOpacity }
 * @returns {Promise<Buffer>}
 */
export async function renderInvoicePdf(invoice, opts = {}) {
  const [logo, watermark] = await Promise.all([
    fetchImage(opts.logo),
    fetchImage(opts.watermark),
  ]);

  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE.margin,
    info: {
      Title: `Invoice ${invoice.invoiceNumber}`,
      Author: opts.siteName || "Invoice",
      Subject: `Invoice ${invoice.invoiceNumber}`,
    },
  });

  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const cur = invoice.currency || "INR";
  const left = PAGE.margin;
  const right = PAGE.width - PAGE.margin;
  const contentWidth = right - left;

  /** Paint the watermark behind whatever comes next on the current page. */
  const paintWatermark = () => {
    if (!watermark) return;
    const opacity = opts.watermarkOpacity ?? 0.05;
    const boxW = contentWidth;
    const boxH = PAGE.height - PAGE.margin * 2;

    doc.save();
    doc.opacity(opacity);
    try {
      doc.image(watermark, left, PAGE.margin, { fit: [boxW, boxH], align: "center", valign: "center" });
    } catch {
      // A corrupt image should not take the invoice down with it.
    }
    doc.opacity(1);
    doc.restore();
  };

  // Every page gets the watermark, including ones the table adds mid-flow.
  doc.on("pageAdded", paintWatermark);
  paintWatermark();

  // ── Header ───────────────────────────────────────────────
  let y = PAGE.margin;

  if (logo) {
    try {
      doc.image(logo, left, y, { fit: [120, 40] });
    } catch { /* ignore an undecodable logo */ }
  }

  doc.font("Helvetica-Bold").fontSize(22).fillColor(INK.heading)
    .text("INVOICE", left, y, { width: contentWidth, align: "right" });

  doc.font("Helvetica").fontSize(10).fillColor(INK.muted)
    .text(invoice.invoiceNumber, left, y + 28, { width: contentWidth, align: "right" });

  doc.font("Helvetica-Bold").fontSize(9).fillColor(INK.body)
    .text(String(invoice.status || "").replace(/_/g, " "), left, y + 44, {
      width: contentWidth, align: "right",
    });

  y += logo ? 52 : 62;

  doc.font("Helvetica-Bold").fontSize(13).fillColor(INK.heading)
    .text(opts.siteName || "", left, y);
  y = doc.y + 2;

  doc.font("Helvetica").fontSize(9).fillColor(INK.muted);
  for (const line of [opts.siteAddress, opts.siteEmail, opts.sitePhone].filter(Boolean)) {
    doc.text(line, left, y);
    y = doc.y;
  }

  // ── Bill to + dates ──────────────────────────────────────
  y += 18;
  const rightColX = left + contentWidth * 0.6;

  doc.font("Helvetica-Bold").fontSize(8).fillColor(INK.muted).text("BILL TO", left, y);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(INK.heading)
    .text(invoice.billToName || invoice.client?.companyName || "—", left, y + 12, {
      width: contentWidth * 0.55,
    });

  let billY = doc.y + 2;
  doc.font("Helvetica").fontSize(9).fillColor(INK.body);
  for (const line of [invoice.billToEmail, invoice.billToAddress].filter(Boolean)) {
    doc.text(line, left, billY, { width: contentWidth * 0.55 });
    billY = doc.y;
  }
  if (invoice.project?.name) {
    doc.fillColor(INK.muted).fontSize(9).text(`Project: ${invoice.project.name}`, left, billY + 2, {
      width: contentWidth * 0.55,
    });
    billY = doc.y;
  }

  const dateRow = (label, value, rowY) => {
    doc.font("Helvetica").fontSize(9).fillColor(INK.muted)
      .text(label, rightColX, rowY, { width: 90, align: "left" });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK.heading)
      .text(value, rightColX + 90, rowY, { width: right - rightColX - 90, align: "right" });
  };

  dateRow("Issue Date", fmtDate(invoice.issueDate), y + 12);
  dateRow("Due Date", fmtDate(invoice.dueDate), y + 28);
  if (invoice.paidAt) dateRow("Paid On", fmtDate(invoice.paidAt), y + 44);

  y = Math.max(billY, y + (invoice.paidAt ? 60 : 44)) + 20;

  // ── Items table ──────────────────────────────────────────
  // Columns are fixed so the money never collides with the description, the
  // same problem the on-screen table had.
  const col = {
    desc: left,
    qty: left + contentWidth - 250,
    rate: left + contentWidth - 190,
    amount: left + contentWidth - 90,
  };
  const width = {
    desc: contentWidth - 260,
    qty: 50,
    rate: 90,
    amount: 90,
  };

  const drawTableHead = (headY) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(INK.muted);
    doc.text("DESCRIPTION", col.desc, headY, { width: width.desc });
    doc.text("QTY", col.qty, headY, { width: width.qty, align: "right" });
    doc.text("UNIT PRICE", col.rate, headY, { width: width.rate, align: "right" });
    doc.text("AMOUNT", col.amount, headY, { width: width.amount, align: "right" });

    const lineY = headY + 12;
    doc.moveTo(left, lineY).lineTo(right, lineY).lineWidth(1).strokeColor(INK.line).stroke();
    return lineY + 8;
  };

  y = drawTableHead(y);

  const bottomLimit = PAGE.height - PAGE.margin - 40;

  for (const item of invoice.items || []) {
    // Measure first so a row is never split across two pages.
    doc.font("Helvetica-Bold").fontSize(10);
    const nameH = doc.heightOfString(item.name || "", { width: width.desc });

    let descH = 0;
    if (item.description) {
      doc.font("Helvetica").fontSize(8);
      descH = doc.heightOfString(item.description, { width: width.desc }) + 2;
    }
    const rowH = Math.max(nameH + descH, 14) + 12;

    if (y + rowH > bottomLimit) {
      doc.addPage();
      y = drawTableHead(PAGE.margin);
    }

    doc.font("Helvetica-Bold").fontSize(10).fillColor(INK.heading)
      .text(item.name || "", col.desc, y, { width: width.desc });

    if (item.description) {
      doc.font("Helvetica").fontSize(8).fillColor(INK.muted)
        .text(item.description, col.desc, y + nameH + 1, { width: width.desc });
    }

    doc.font("Helvetica").fontSize(10).fillColor(INK.body);
    doc.text(String(Number(item.quantity)), col.qty, y, { width: width.qty, align: "right" });
    doc.text(money(item.unitPrice, cur), col.rate, y, { width: width.rate, align: "right" });
    doc.font("Helvetica-Bold").fillColor(INK.heading)
      .text(money(item.amount, cur), col.amount, y, { width: width.amount, align: "right" });

    y += rowH;
    doc.moveTo(left, y - 6).lineTo(right, y - 6).lineWidth(0.5).strokeColor(INK.hairline).stroke();
  }

  // ── Totals ───────────────────────────────────────────────
  const totalsNeeded = 120;
  if (y + totalsNeeded > bottomLimit) {
    doc.addPage();
    y = PAGE.margin;
  }

  y += 10;
  const totalRow = (label, value, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10)
      .fillColor(bold ? INK.heading : INK.body);
    doc.text(label, col.rate - 60, y, { width: width.rate + 60, align: "left" });
    doc.text(value, col.amount, y, { width: width.amount, align: "right" });
    y = doc.y + 6;
  };

  totalRow("Subtotal", money(invoice.subtotal, cur));

  const discount = Number(invoice.discountAmount) || 0;
  if (discount > 0) {
    totalRow("Discount", `- ${money(discount, cur)}`);
    totalRow("After discount", money(Number(invoice.subtotal) - discount, cur));
  }

  const taxPct = Number(invoice.taxPercent) || 0;
  if (taxPct > 0) totalRow(`Tax (${taxPct}%)`, money(invoice.taxAmount, cur));

  doc.moveTo(col.rate - 60, y).lineTo(right, y).lineWidth(1).strokeColor(INK.line).stroke();
  y += 8;
  totalRow("Total", money(invoice.total, cur), true);

  const paid = Number(invoice.amountPaid) || 0;
  if (paid > 0) {
    totalRow("Paid", money(paid, cur));
    totalRow("Balance", money(Number(invoice.total) - paid, cur), true);
  }

  // ── Payment details ──────────────────────────────────────
  const pay = invoice.paymentDetails;
  if (pay) {
    if (y + 110 > bottomLimit) {
      doc.addPage();
      y = PAGE.margin;
    }
    y += 16;

    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK.heading).text("PAYMENT DETAILS", left, y);
    y = doc.y + 6;

    const lines =
      pay.type === "BANK"
        ? [
            ["Bank", pay.bankName],
            ["Account name", pay.accountHolderName],
            ["Account number", pay.accountNumber],
            ["IFSC", pay.ifscCode],
            ["Branch", pay.branch],
          ]
        : [
            ["UPI ID", pay.upiId],
            ["Name", pay.upiName],
          ];

    doc.fontSize(9);
    for (const [label, value] of lines.filter(([, v]) => v)) {
      doc.font("Helvetica").fillColor(INK.muted).text(label, left, y, { width: 120 });
      doc.font("Helvetica-Bold").fillColor(INK.body).text(String(value), left + 120, y, { width: 240 });
      y = doc.y + 2;
    }
  }

  // ── Notes and terms ──────────────────────────────────────
  for (const [heading, text] of [["NOTES", invoice.notes], ["TERMS", invoice.terms]]) {
    if (!text) continue;

    doc.font("Helvetica").fontSize(9);
    const needed = doc.heightOfString(text, { width: contentWidth }) + 26;
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = PAGE.margin;
    }

    y += 14;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(INK.muted).text(heading, left, y);
    doc.font("Helvetica").fontSize(9).fillColor(INK.body)
      .text(text, left, doc.y + 3, { width: contentWidth });
    y = doc.y;
  }

  doc.end();
  return done;
}
