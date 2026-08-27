/**
 * Tiny arithmetic evaluator for derived-metric formulas.
 *
 * Formulas are admin-authored strings like "clicks / impressions * 100".
 * They are NOT run through eval(): a stored formula is data, and data must
 * never become executable. This parser understands numbers, identifiers,
 * + - * / and parentheses, and nothing else.
 */

const NUMBER = /^\d+(\.\d+)?/;
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*/;

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " " || ch === "\t") { i += 1; continue; }
    if ("+-*/()".includes(ch)) { tokens.push({ t: ch }); i += 1; continue; }

    const rest = src.slice(i);
    const num = NUMBER.exec(rest);
    if (num) { tokens.push({ t: "num", v: Number(num[0]) }); i += num[0].length; continue; }

    const id = IDENT.exec(rest);
    if (id) { tokens.push({ t: "id", v: id[0] }); i += id[0].length; continue; }

    throw new Error(`Unexpected character "${ch}" in formula`);
  }
  return tokens;
}

/**
 * Recursive descent: expr → term (('+'|'-') term)*, term → factor (('*'|'/') factor)*
 * Division by zero yields null so a quiet day reports "—" instead of Infinity.
 */
function parse(tokens, scope) {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = (t) => (peek()?.t === t ? tokens[pos++] : null);

  function factor() {
    if (eat("(")) {
      const v = expr();
      if (!eat(")")) throw new Error("Unbalanced parenthesis in formula");
      return v;
    }
    if (eat("-")) {
      const v = factor();
      return v === null ? null : -v;
    }
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of formula");
    pos += 1;
    if (tok.t === "num") return tok.v;
    if (tok.t === "id") {
      const raw = scope[tok.v];
      return raw === undefined || raw === null || raw === "" ? 0 : Number(raw) || 0;
    }
    throw new Error(`Unexpected token in formula`);
  }

  function term() {
    let left = factor();
    for (;;) {
      if (eat("*")) {
        const right = factor();
        left = left === null || right === null ? null : left * right;
      } else if (eat("/")) {
        const right = factor();
        // Guarded: a zero denominator means "not measurable", not an error.
        left = left === null || right === null || right === 0 ? null : left / right;
      } else return left;
    }
  }

  function expr() {
    let left = term();
    for (;;) {
      if (eat("+")) {
        const right = term();
        left = left === null || right === null ? null : left + right;
      } else if (eat("-")) {
        const right = term();
        left = left === null || right === null ? null : left - right;
      } else return left;
    }
  }

  const value = expr();
  if (pos !== tokens.length) throw new Error("Trailing tokens in formula");
  return value;
}

/**
 * Evaluate one formula against a scope of metric values.
 *
 * @param {string} formula
 * @param {object} scope   metric id → number, plus `spend`
 * @returns {number|null}  null when not measurable or the formula is broken
 */
export function evaluateFormula(formula, scope) {
  try {
    const value = parse(tokenize(String(formula)), scope || {});
    return value === null || Number.isNaN(value) || !Number.isFinite(value) ? null : value;
  } catch {
    // A bad formula must never take down a report.
    return null;
  }
}

/**
 * Run a campaign type's derived metrics over a set of totals.
 *
 * @param {Array} derivedMetrics  from CampaignType
 * @param {object} scope          metric totals + spend
 * @returns {Array<{id,label,format,value}>}
 */
export function computeDerived(derivedMetrics, scope) {
  if (!Array.isArray(derivedMetrics)) return [];
  return derivedMetrics.map((d) => ({
    id: d.id,
    label: d.label,
    format: d.format || "number",
    value: evaluateFormula(d.formula, scope),
  }));
}
