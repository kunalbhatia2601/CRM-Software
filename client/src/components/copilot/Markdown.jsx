"use client";

import { Fragment } from "react";

/**
 * Lightweight markdown renderer for copilot messages.
 * Supports: headings, bold, italic, inline code, code blocks, unordered/ordered
 * lists, tables, links, and entity links [Name](type:id) rendered as chips.
 *
 * No external dependency (this project pins a custom Next.js build).
 *
 * @param {string} text
 * @param {(entity:{name,entityType,entityId})=>void} onEntityClick
 */
export default function Markdown({ text, onEntityClick }) {
  if (!text) return null;
  const clean = String(text).replace(/<[^>]*>/g, ""); // strip stray HTML
  const blocks = splitBlocks(clean);

  return (
    <div className="cp-md space-y-2 text-sm leading-relaxed">
      {blocks.map((b, i) => renderBlock(b, i, onEntityClick))}
    </div>
  );
}

// ── Block splitting ──
function splitBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // code fence
    if (line.trim().startsWith("```")) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
      i++; // closing fence
      blocks.push({ type: "code", content: buf.join("\n") });
      continue;
    }

    // table (header | separator | rows)
    if (line.includes("|") && lines[i + 1] && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const buf = [line];
      i++;
      // separator
      buf.push(lines[i]); i++;
      while (i < lines.length && lines[i].includes("|")) { buf.push(lines[i]); i++; }
      blocks.push({ type: "table", content: buf });
      continue;
    }

    // heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) { blocks.push({ type: "heading", level: h[1].length, content: h[2] }); i++; continue; }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
      blocks.push({ type: "ul", items: buf });
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      blocks.push({ type: "ol", items: buf });
      continue;
    }

    // blank
    if (line.trim() === "") { i++; continue; }

    // paragraph — collect until blank / special
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" &&
      !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("```") && !/^#{1,3}\s/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    blocks.push({ type: "p", content: buf.join(" ") });
  }
  return blocks;
}

function renderBlock(b, key, onEntityClick) {
  switch (b.type) {
    case "heading": {
      const cls = b.level === 1 ? "text-base font-bold" : b.level === 2 ? "text-sm font-bold" : "text-sm font-semibold";
      return <div key={key} className={`${cls} text-slate-900 dark:text-slate-50 mt-1`}>{renderInline(b.content, onEntityClick)}</div>;
    }
    case "code":
      return (
        <pre key={key} className="bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto">
          <code>{b.content}</code>
        </pre>
      );
    case "ul":
      return (
        <ul key={key} className="list-disc pl-5 space-y-0.5">
          {b.items.map((it, j) => <li key={j}>{renderInline(it, onEntityClick)}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol key={key} className="list-decimal pl-5 space-y-0.5">
          {b.items.map((it, j) => <li key={j}>{renderInline(it, onEntityClick)}</li>)}
        </ol>
      );
    case "table":
      return renderTable(b.content, key, onEntityClick);
    default:
      return <p key={key}>{renderInline(b.content, onEntityClick)}</p>;
  }
}

function renderTable(rows, key, onEntityClick) {
  const cells = (r) => r.split("|").map((c) => c.trim()).filter((_, i, arr) => !(i === 0 && arr[0] === "") && !(i === arr.length - 1 && arr[arr.length - 1] === ""));
  const header = cells(rows[0]);
  const body = rows.slice(2).map(cells);
  return (
    <div key={key} className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>{header.map((h, i) => <th key={i} className="text-left font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 py-1.5 pr-3">{renderInline(h, onEntityClick)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-100 dark:border-slate-800">
              {row.map((c, ci) => <td key={ci} className="py-1.5 pr-3 text-slate-700 dark:text-slate-300">{renderInline(c, onEntityClick)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Inline: bold, italic, code, entity links, plain links ──
function renderInline(text, onEntityClick) {
  if (!text) return null;
  // token pattern: entity link | md link | bold | italic | inline code
  const pattern = /(\[[^\]]+\]\([a-z]+:[a-zA-Z0-9_-]+\))|(\[[^\]]+\]\(https?:\/\/[^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)/g;
  const out = [];
  let last = 0;
  let m;
  let k = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    if (m[1]) {
      // entity link
      const em = tok.match(/\[([^\]]+)\]\(([a-z]+):([a-zA-Z0-9_-]+)\)/);
      out.push(
        <button key={k++} onClick={() => onEntityClick?.({ name: em[1], entityType: em[2], entityId: em[3] })}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900 align-baseline">
          {em[1]}
        </button>
      );
    } else if (m[2]) {
      const lm = tok.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      out.push(<a key={k++} href={lm[2]} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">{lm[1]}</a>);
    } else if (m[3]) {
      out.push(<strong key={k++} className="font-semibold">{tok.slice(2, -2)}</strong>);
    } else if (m[4]) {
      out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    } else if (m[5]) {
      out.push(<code key={k++} className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[0.85em] font-mono">{tok.slice(1, -1)}</code>);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return out;
}
