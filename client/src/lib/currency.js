/**
 * Client-side currency utility for TaskGo Agency Suite.
 *
 * All monetary values from the backend are in INR (base currency).
 * This utility converts and formats amounts based on the site's
 * configured currency and exchange rates from SiteContext.
 *
 * Usage in components:
 *   import { useCurrency } from "@/lib/currency";
 *   const { format, formatCompact, convert } = useCurrency();
 *   <span>{format(420000)}</span>       // "₹4,20,000.00" or "$4,565.22"
 *   <span>{formatCompact(420000)}</span> // "₹4.2L" or "$4.6K"
 */

// ─── Currency Metadata ──────────────────────────────────────

const CURRENCY_CONFIG = {
  INR: {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
  },
  USD: {
    code: "USD",
    symbol: "$",
    locale: "en-US",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    locale: "de-DE",
  },
};

/**
 * Get config for a currency code.
 * @param {"INR"|"USD"|"EUR"} code
 */
export function getCurrencyConfig(code = "INR") {
  return CURRENCY_CONFIG[code] || CURRENCY_CONFIG.INR;
}

/**
 * Get just the symbol.
 * @param {"INR"|"USD"|"EUR"} code
 * @returns {string}
 */
export function getCurrencySymbol(code = "INR") {
  return getCurrencyConfig(code).symbol;
}

// ─── Conversion ─────────────────────────────────────────────

/**
 * Convert an INR amount to the target currency.
 *
 * @param {number} amountInINR
 * @param {"INR"|"USD"|"EUR"} targetCurrency
 * @param {{ usdToInr?: number, eurToInr?: number }} rates
 * @returns {number}
 */
export function convertFromINR(amountInINR, targetCurrency = "INR", rates = {}) {
  const num = Number(amountInINR) || 0;
  if (targetCurrency === "INR") return num;

  const usdToInr = Number(rates.usdToInr) || 92;
  const eurToInr = Number(rates.eurToInr) || 105;

  if (targetCurrency === "USD") return num / usdToInr;
  if (targetCurrency === "EUR") return num / eurToInr;

  return num;
}

/**
 * Convert from any currency TO INR (for sending to backend).
 *
 * @param {number} amount
 * @param {"INR"|"USD"|"EUR"} fromCurrency
 * @param {{ usdToInr?: number, eurToInr?: number }} rates
 * @returns {number}
 */
export function convertToINR(amount, fromCurrency = "INR", rates = {}) {
  const num = Number(amount) || 0;
  if (fromCurrency === "INR") return num;

  const usdToInr = Number(rates.usdToInr) || 92;
  const eurToInr = Number(rates.eurToInr) || 105;

  if (fromCurrency === "USD") return num * usdToInr;
  if (fromCurrency === "EUR") return num * eurToInr;

  return num;
}

/**
 * Convert between any two currencies (goes through INR as base).
 *
 * @param {number} amount
 * @param {"INR"|"USD"|"EUR"} from
 * @param {"INR"|"USD"|"EUR"} to
 * @param {{ usdToInr?: number, eurToInr?: number }} rates
 * @returns {number}
 */
export function convertCurrency(amount, from, to, rates = {}) {
  if (from === to) return Number(amount) || 0;
  const inINR = convertToINR(amount, from, rates);
  return convertFromINR(inINR, to, rates);
}

// ─── Formatting ─────────────────────────────────────────────

/**
 * Format a number in the given currency using Intl.
 * The amount should already be in the target currency.
 *
 * @param {number} amount — in target currency
 * @param {"INR"|"USD"|"EUR"} currencyCode
 * @param {{ compact?: boolean, decimals?: number }} options
 * @returns {string}
 */
export function formatAmount(amount, currencyCode = "INR", options = {}) {
  const num = Number(amount) || 0;
  const { compact = false, decimals = 2 } = options;
  const { locale } = getCurrencyConfig(currencyCode);

  if (compact) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(num);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * All-in-one: convert from INR (DB value) and format.
 *
 * @param {number} amountInINR — raw DB value
 * @param {"INR"|"USD"|"EUR"} targetCurrency
 * @param {{ usdToInr?: number, eurToInr?: number }} rates
 * @param {{ compact?: boolean, decimals?: number }} formatOptions
 * @returns {string}
 */
export function formatFromINR(amountInINR, targetCurrency, rates, formatOptions = {}) {
  const converted = convertFromINR(amountInINR, targetCurrency, rates);
  return formatAmount(converted, targetCurrency, formatOptions);
}

// ─── React Hook ─────────────────────────────────────────────

/**
 * Creates a set of currency helpers bound to site data.
 * Call this from a component that has access to site data.
 *
 * Usage:
 *   const site = useSite();
 *   const { format, formatCompact, convert, symbol } = createCurrencyHelpers(site);
 *
 * @param {{ currency?: string, usdToInr?: number, eurToInr?: number }} siteData
 */
export function createCurrencyHelpers(siteData = {}) {
  const currency = siteData.currency || "INR";
  const rates = {
    usdToInr: Number(siteData.usdToInr) || 92,
    eurToInr: Number(siteData.eurToInr) || 105,
  };

  return {
    /** Current currency code */
    currency,

    /** Current currency symbol */
    symbol: getCurrencySymbol(currency),

    /** Current exchange rates */
    rates,

    /**
     * Format a DB amount (INR) into the site's display currency.
     * @param {number} amountInINR
     * @param {{ compact?: boolean, decimals?: number }} options
     * @returns {string}
     */
    format: (amountInINR, options = {}) =>
      formatFromINR(amountInINR, currency, rates, options),

    /**
     * Compact format (e.g. ₹4.2L, $4.6K, €3.5K).
     * @param {number} amountInINR
     * @returns {string}
     */
    formatCompact: (amountInINR) =>
      formatFromINR(amountInINR, currency, rates, { compact: true }),

    /**
     * Convert a DB amount (INR) to the site currency as a raw number.
     * @param {number} amountInINR
     * @returns {number}
     */
    convert: (amountInINR) => convertFromINR(amountInINR, currency, rates),

    /**
     * Convert a display amount (in site currency) back to INR for saving.
     * @param {number} displayAmount
     * @returns {number}
     */
    toINR: (displayAmount) => convertToINR(displayAmount, currency, rates),

    /**
     * Convert between any two currencies.
     * @param {number} amount
     * @param {"INR"|"USD"|"EUR"} from
     * @param {"INR"|"USD"|"EUR"} to
     * @returns {number}
     */
    convertBetween: (amount, from, to) =>
      convertCurrency(amount, from, to, rates),

    /**
     * Format an amount that's already in the site currency (not from DB).
     * @param {number} amount
     * @param {{ compact?: boolean, decimals?: number }} options
     * @returns {string}
     */
    formatDirect: (amount, options = {}) =>
      formatAmount(amount, currency, options),
  };
}
