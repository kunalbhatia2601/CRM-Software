/**
 * Date and time formatting that renders identically on the server and in the
 * browser.
 *
 * `toLocaleTimeString("en-IN", …)` is not safe for server-rendered markup: Node
 * and the browser ship different ICU data, and they disagree on the day-period
 * casing — Node emits "06:45 pm" where Chrome emits "06:45 PM". React sees the
 * mismatch and throws a hydration error. Building the string by hand removes
 * the runtime from the decision.
 */

/**
 * Time as "06:45 PM".
 *
 * @param {Date|string|number} value
 * @param {string} fallback returned for a missing or unparseable value
 */
export function formatTime(value, fallback = "") {
  if (!value) return fallback;

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;

  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = String(hours % 12 || 12).padStart(2, "0");

  return `${hour12}:${minutes} ${period}`;
}

/**
 * True when a timestamp carries no time of day.
 *
 * Dates that come from a date-only field — a due date, a milestone — land on
 * midnight, and showing "12:00 AM" for them reads as a real appointment.
 */
export function isMidnight(value) {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return d.getHours() === 0 && d.getMinutes() === 0;
}

/** Time, or a label when the value is a date without a time. */
export function formatTimeOrAllDay(value, allDayLabel = "All day") {
  if (!value) return "";
  return isMidnight(value) ? allDayLabel : formatTime(value);
}
