/**
 * Contrast-checking script (design §5.6, Requirement 18.6/18.7).
 *
 * Run with `npm run check:contrast`. Does three things:
 *  1. Parses `src/app/globals.css` and asserts every hex in `TOKENS` appears
 *     declared against its primary CSS variable name, so the stylesheet and
 *     the token file cannot quietly drift apart.
 *  2. Computes every `PAIRINGS` ratio with the WCAG relative-luminance
 *     formula and compares it against the row's declared threshold and
 *     expected pass/fail.
 *  3. Rewrites the `<!-- contrast:start -->…<!-- contrast:end -->` block in
 *     `docs/accessibility-report.md` with the resulting table and run date.
 *
 * Exits 1 if a pairing's measured result does not match its `expect`, or if
 * a token's hex is missing or mismatched in the stylesheet.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PAIRINGS, TOKENS } from "../src/lib/design-tokens";

const ROOT = path.resolve(import.meta.dirname, "..");
const CSS_PATH = path.join(ROOT, "src/app/globals.css");
const REPORT_PATH = path.join(ROOT, "docs/accessibility-report.md");

/** sRGB channel (0-255) -> linearised channel, per the WCAG 2.1 formula. */
function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** WCAG 2.1 contrast ratio between two hex colours, 1 (no contrast) to 21. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseCssVariables(css: string): Map<string, string> {
  const vars = new Map<string, string>();
  const re = /(--[\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    vars.set(match[1], match[2].toUpperCase());
  }
  return vars;
}

function main() {
  let exitCode = 0;
  const css = readFileSync(CSS_PATH, "utf8");
  const cssVars = parseCssVariables(css);

  console.log("Checking token declarations against src/app/globals.css ...");
  for (const token of TOKENS) {
    const declared = cssVars.get(token.name);
    if (!declared) {
      console.error(`  MISSING  ${token.name} is not declared in globals.css (expected ${token.hex})`);
      exitCode = 1;
      continue;
    }
    if (declared !== token.hex.toUpperCase()) {
      console.error(`  DRIFT    ${token.name} is ${declared} in globals.css but ${token.hex} in design-tokens.ts`);
      exitCode = 1;
    }
  }

  console.log("Checking contrast pairings against the WCAG relative-luminance formula ...");
  const rows: string[] = [];
  rows.push("| # | Where it is used | Foreground | Background | Measured | Needs | Result |");
  rows.push("| --- | --- | --- | --- | --- | --- | --- |");

  for (const pairing of PAIRINGS) {
    const measured = contrastRatio(pairing.fg, pairing.bg);
    const passed = pairing.threshold === null ? true : measured >= pairing.threshold;
    const result = passed ? "pass" : "fail";
    const matchesExpectation = result === pairing.expect || pairing.threshold === null;

    if (!matchesExpectation) {
      console.error(
        `  MISMATCH row ${pairing.row}: measured ${measured.toFixed(2)}:1 against ${pairing.fg} on ${pairing.bg}, ` +
          `expected to ${pairing.expect} a ${pairing.threshold}:1 threshold but it ${result}ed`,
      );
      exitCode = 1;
    }

    const icon = pairing.expect === "fail" ? "❌" : "✅";
    rows.push(
      `| ${pairing.row} | ${pairing.usage} | \`${pairing.fg}\` | \`${pairing.bg}\` | **${measured.toFixed(2)}** | ${pairing.threshold ?? "—"} | ${icon} |`,
    );
  }

  const block = [
    "<!-- contrast:start -->",
    `_Last run: ${new Date().toISOString()}_`,
    "",
    ...rows,
    "<!-- contrast:end -->",
  ].join("\n");

  const report = readFileSync(REPORT_PATH, "utf8");
  const rewritten = report.replace(/<!-- contrast:start -->[\s\S]*<!-- contrast:end -->/, block);
  writeFileSync(REPORT_PATH, rewritten);
  console.log(`Wrote the contrast table to ${path.relative(ROOT, REPORT_PATH)}`);

  if (exitCode === 0) {
    console.log("All token declarations and contrast pairings check out.");
  } else {
    console.error("Contrast check failed — see the MISSING / DRIFT / MISMATCH lines above.");
  }
  process.exit(exitCode);
}

// Only run when this file is the process entry point (`tsx scripts/check-contrast.ts`
// or `npm run check:contrast`) — not when `contrastRatio` is imported by the Vitest suite.
if (import.meta.filename === process.argv[1]) {
  main();
}
