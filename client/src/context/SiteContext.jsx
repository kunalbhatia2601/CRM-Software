"use client";

import { createContext, useContext, useMemo } from "react";
import { createCurrencyHelpers } from "@/lib/currency";

const SiteContext = createContext(null);

/**
 * Provides site data (name, logo, contact info, currency config)
 * plus pre-bound currency helpers to all client components.
 * Wrap the app tree with this in the root layout.
 */
export function SiteProvider({ children, siteData }) {
  const data = siteData || {
    name: "TaskGo Agency",
    logo: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    currency: "INR",
    usdToInr: 92,
    eurToInr: 105,
  };

  // Memoize currency helpers so they don't recalculate every render
  const currencyHelpers = useMemo(() => createCurrencyHelpers(data), [
    data.currency,
    data.usdToInr,
    data.eurToInr,
  ]);

  const value = useMemo(
    () => ({ ...data, ...currencyHelpers }),
    [data, currencyHelpers]
  );

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
}

/**
 * Hook to access site data + currency helpers in any client component.
 *
 * Returns:
 *   Site fields: name, logo, contactEmail, contactPhone, address,
 *                currency, usdToInr, eurToInr, ...
 *
 *   Currency helpers:
 *     symbol         — "₹" | "$" | "€"
 *     rates          — { usdToInr, eurToInr }
 *     format(inr)    — "₹4,20,000.00" or "$4,565.22"
 *     formatCompact(inr) — "₹4.2L" or "$4.6K"
 *     convert(inr)   — raw number in display currency
 *     toINR(display)  — convert back to INR for API calls
 *     convertBetween(amt, from, to) — cross-currency conversion
 *     formatDirect(amt) — format an already-converted amount
 */
export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    // Fallback if used outside provider
    return {
      name: "TaskGo Agency",
      logo: null,
      currency: "INR",
      symbol: "₹",
      ...createCurrencyHelpers(),
    };
  }
  return ctx;
}

export default SiteContext;
