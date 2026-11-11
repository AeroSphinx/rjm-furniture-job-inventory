/**
 * Dates always go through this one helper, pinned to `en-PH`, so both
 * languages render identical date text (Requirement 16.5) — next-intl's
 * own `dateTime()` formats with the *UI* locale, which would quietly
 * localise month names in Filipino (design §16.1). Money stays on
 * next-intl's `useFormatter().number(v, "money")`, because `Intl.NumberFormat`
 * renders `₱12,500.00` identically under both locales.
 */
const DATE_LOCALE = "en-PH";
const TZ = "Asia/Manila";

export function formatDate(date: Date | string, style: "short" | "medium" = "short"): string {
  const options: Intl.DateTimeFormatOptions =
    style === "short"
      ? { year: "numeric", month: "short", day: "numeric", timeZone: TZ }
      : { year: "numeric", month: "long", day: "numeric", timeZone: TZ };
  return new Intl.DateTimeFormat(DATE_LOCALE, options).format(new Date(date));
}

const HONORIFICS = new Set(["mang", "aling", "kuya", "ate", "tito", "tita"]);

/**
 * Requirement 7.2's "first name or nickname" for the Dashboard greeting.
 * A bare first token would turn "Mang Roger Mendoza" into "Mang", which is
 * an honorific, not a name — so a leading Filipino honorific is kept with
 * the name that follows it. Everything else is just the first token.
 */
export function greetingName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = (parts[0] ?? "").toLowerCase();
  if (HONORIFICS.has(first) && parts.length > 1) {
    return `${parts[0]} ${parts[1]}`;
  }
  return parts[0] ?? "";
}

/**
 * The Dashboard greeting's time-of-day branch (Requirement 7.2), read
 * against the shop's own clock (`Asia/Manila`) rather than the server's,
 * so a Dashboard rendered on a UTC host still says "Good morning" at
 * 8 a.m. in the shop.
 */
export function greetingPeriod(date: Date = new Date()): "morning" | "afternoon" | "evening" {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: TZ }).format(date));
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
