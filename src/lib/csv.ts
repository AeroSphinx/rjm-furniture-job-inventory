/**
 * CSV export for Reports (Requirement 14.10, `[SHOULD]`). Kept to exactly
 * what the requirement asks for — UTF-8, a header row per table, commas/
 * quotes/newlines escaped per RFC 4180 — no CSV library, since one
 * function covers the whole rule (brief ADDENDUM 2: no speculative
 * abstraction for a four-day build).
 */

/** Wraps a field in quotes (doubling any embedded quote) whenever it contains a comma, quote or newline. */
export function escapeCsvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/["\n\r,]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCsvField).join(",");
}

export type CsvSection = {
  /** Printed as its own one-cell row above the section's header row. */
  title: string;
  header: string[];
  rows: (string | number | null | undefined)[][];
};

/** Stacks one or more header+rows tables into a single CSV, blank line between tables. */
export function buildCsv(sections: CsvSection[]): string {
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(toCsvRow([section.title]));
    lines.push(toCsvRow(section.header));
    for (const row of section.rows) lines.push(toCsvRow(row));
    lines.push("");
  }
  return lines.join("\r\n");
}

/**
 * Triggers a browser download of the CSV text. A leading BOM is required
 * for Excel (the most likely reader for this export) to recognise the
 * file as UTF-8 rather than guessing a local 8-bit codepage and mangling
 * the peso sign or any accented name.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
