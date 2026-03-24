/**
 * Server-side currency utility for TaskGo Agency Suite.
 *
 * All monetary values in the DB are stored in INR (base currency).
 * This utility converts and formats amounts based on the site's
 * configured currency and exchange rates.
 *
 * Exchange rates stored in Site table:
 *   usdToInr  →  1 USD = X INR
 *   eurToInr  →  1 EUR = X INR
 */

// ─── Currency Metadata ──────────────────────────────────────

const CURRENCY_CONFIG = {
  INR: {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
    decimalSeparator: ".",
    thousandSeparator: ",",
    position: "prefix", // symbol before amount
  },
  USD: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
    decimalSeparator: ".",
    thousandSeparator: ",",
    position: "prefix",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    locale: "de-DE",
    decimalSeparator: ",",
    thousandSeparator: ".",
    position: "prefix",
  },
};

/**
 * Get the full config object for a given currency code.
 * @param {"INR"|"USD"|"EUR"} code
 */
export function getCurrencyConfig(code = "INR") {
  return CURRENCY_CONFIG[code] || CURRENCY_CONFIG.INR;
}

/**
 * Convert an amount from INR (base) to the target currency.
 *
 * @param {number} amountInINR  — the amount stored in DB (always INR)
 * @param {"INR"|"USD"|"EUR"} targetCurrency
 * @param {{ usdToInr: number, eurToInr: number }} rates — from Site record
 * @returns {number}
 */
export function convertFromINR(amountInINR, targetCurrency, rates) {
  const num = Number(amountInINR) || 0;
  if (targetCurrency === "INR") return num;

  const usdToInr = Number(rates.usdToInr) || 92;
  const eurToInr = Number(rates.eurToInr) || 105;

  if (targetCurrency === "USD") return num / usdToInr;
  if (targetCurrency === "EUR") return num / eurToInr;

  return num; // fallback
}

/**
 * Convert an amount from any currency TO INR (for storing in DB).
 *
 * @param {number} amount
 * @param {"INR"|"USD"|"EUR"} fromCurrency
 * @param {{ usdToInr: number, eurToInr: number }} rates
 * @returns {number}
 */
export function convertToINR(amount, fromCurrency, rates) {
  const num = Number(amount) || 0;
  if (fromCurrency === "INR") return num;

  const usdToInr = Number(rates.usdToInr) || 92;
  const eurToInr = Number(rates.eurToInr) || 105;

  if (fromCurrency === "USD") return num * usdToInr;
  if (fromCurrency === "EUR") return num * eurToInr;

  return num;
}

/**
 * Format a number as a currency string using the native Intl API.
 *
 * @param {number} amount — already in the target currency
 * @param {"INR"|"USD"|"EUR"} currencyCode
 * @param {{ compact?: boolean, decimals?: number }} options
 * @returns {string}  e.g. "₹4,20,000.00" or "$4,565.22" or "€3,500.00"
 */
export function formatCurrency(amount, currencyCode = "INR", options = {}) {
  const num = Number(amount) || 0;
  const { compact = false, decimals = 2 } = options;

  if (compact) {
    return new Intl.NumberFormat(getCurrencyConfig(currencyCode).locale, {
      style: "currency",
      currency: currencyCode,
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(num);
  }

  return new Intl.NumberFormat(getCurrencyConfig(currencyCode).locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * All-in-one: convert from INR and format in one call.
 *
 * @param {number} amountInINR
 * @param {"INR"|"USD"|"EUR"} targetCurrency
 * @param {{ usdToInr: number, eurToInr: number }} rates
 * @param {{ compact?: boolean, decimals?: number }} formatOptions
 * @returns {string}
 */
export function convertAndFormat(amountInINR, targetCurrency, rates, formatOptions = {}) {
  const converted = convertFromINR(amountInINR, targetCurrency, rates);
  return formatCurrency(converted, targetCurrency, formatOptions);
}
