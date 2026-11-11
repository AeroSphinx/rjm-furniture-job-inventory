import { formatDate } from "@/lib/format";

/**
 * Reports' range selector (design §20, open decision O8): four presets,
 * each resolving to the `(from, to)` pair `report_summary()` takes, so a
 * custom date picker could be added later without touching the function.
 */
export const REPORT_RANGE_PRESETS = ["this_month", "last_month", "last_3_months", "this_year"] as const;
export type ReportRangePreset = (typeof REPORT_RANGE_PRESETS)[number];

export const REPORT_RANGE_PRESET_KEYS: Record<ReportRangePreset, "rangeThisMonth" | "rangeLastMonth" | "rangeLast3Months" | "rangeThisYear"> = {
  this_month: "rangeThisMonth",
  last_month: "rangeLastMonth",
  last_3_months: "rangeLast3Months",
  this_year: "rangeThisYear",
};

function isPreset(value: string): value is ReportRangePreset {
  return (REPORT_RANGE_PRESETS as readonly string[]).includes(value);
}

export type ResolvedReportRange = {
  preset: ReportRangePreset;
  from: Date;
  to: Date;
};

/**
 * Resolves a (possibly missing or invalid) `?range=` value into a real
 * `(from, to)` pair. Unknown input falls back to "This month" rather than
 * failing the page — the same "fall back to the default, never fail the
 * render" rule Requirement 15.16 states for preferences.
 */
export function resolveReportRange(rawPreset: string | undefined): ResolvedReportRange {
  const preset = rawPreset && isPreset(rawPreset) ? rawPreset : "this_month";
  const today = new Date();
  const to = today;

  if (preset === "last_month") {
    const firstOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const from = new Date(firstOfThisMonth.getFullYear(), firstOfThisMonth.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(firstOfThisMonth.getFullYear(), firstOfThisMonth.getMonth(), 0);
    return { preset, from, to: lastOfLastMonth };
  }
  if (preset === "last_3_months") {
    return { preset, from: new Date(today.getFullYear(), today.getMonth() - 2, 1), to };
  }
  if (preset === "this_year") {
    return { preset, from: new Date(today.getFullYear(), 0, 1), to };
  }
  return { preset, from: new Date(today.getFullYear(), today.getMonth(), 1), to };
}

/** `yyyy-mm-dd`, what `report_summary(p_from date, p_to date)` takes. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The range's human-readable subtitle (Requirement 14.4), e.g. "Nov 1 - Nov 10, 2026". */
export function formatRangeLabel(from: Date, to: Date): string {
  return `${formatDate(from)} - ${formatDate(to)}`;
}
