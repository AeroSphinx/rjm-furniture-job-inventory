/**
 * The design-token data behind `scripts/check-contrast.ts` (design §5.4, §5.6).
 *
 * `TOKENS` is every hex value declared in `src/app/globals.css`, each under
 * its *primary* CSS variable name. A few hexes are deliberately shared by
 * more than one variable name (for example `#65769D` is both `--dusk-700`
 * and `--navy-300`); the primary name is the one the contrast script asserts
 * against, and the rest are recorded as `aliases` so the purpose of each
 * name stays documented without the script tracking it twice.
 *
 * `PAIRINGS` is the §5.4 contrast table as data: 52 numbered rows (a few
 * split into lettered sub-rows where the design rejects one pairing and
 * adopts a replacement next to it). `expect: "fail"` rows are kept in the
 * table on purpose — they are the pairings a designer would reach for
 * naturally and they fail, so the table records the failure and the
 * adopted replacement beside it. `scripts/check-contrast.ts` only exits 1
 * on a row whose measured result does not match its `expect`.
 */

export type TokenEntry = {
  name: string;
  hex: string;
  aliases: string[];
};

export const TOKENS: TokenEntry[] = [
  // Dusk ramp
  { name: "--dusk-50", hex: "#F8FAFD", aliases: [] },
  { name: "--dusk-100", hex: "#F0F3FB", aliases: [] },
  { name: "--dusk-200", hex: "#E0E7F6", aliases: ["--neutral-surface"] },
  { name: "--dusk-300", hex: "#CBD6F0", aliases: [] },
  { name: "--dusk-400", hex: "#B4C4E9", aliases: [] },
  { name: "--dusk-500", hex: "#9FB4E3", aliases: [] },
  { name: "--dusk-600", hex: "#8295C0", aliases: [] },
  { name: "--dusk-700", hex: "#65769D", aliases: ["--navy-300", "--neutral-500", "--info-accent", "--neutral-accent"] },
  { name: "--dusk-800", hex: "#445576", aliases: [] },
  { name: "--dusk-900", hex: "#2A3956", aliases: ["--navy-600"] },

  // Navy ramp
  { name: "--navy-50", hex: "#96ABD8", aliases: [] },
  { name: "--navy-100", hex: "#8DA2CE", aliases: [] },
  { name: "--navy-200", hex: "#7C8FB9", aliases: [] },
  { name: "--navy-400", hex: "#4D5E80", aliases: ["--neutral-700"] },
  { name: "--navy-500", hex: "#394868", aliases: [] },
  { name: "--navy-700", hex: "#1F2C48", aliases: ["--info-text"] },
  { name: "--navy-800", hex: "#16233E", aliases: [] },
  { name: "--navy-900", hex: "#0D1A33", aliases: ["--neutral-900", "--neutral-text"] },

  // Orange ramp
  { name: "--orange-50", hex: "#FFF3EE", aliases: [] },
  { name: "--orange-100", hex: "#FFE4D9", aliases: [] },
  { name: "--orange-200", hex: "#FFC9B3", aliases: [] },
  { name: "--orange-300", hex: "#FFA984", aliases: [] },
  { name: "--orange-400", hex: "#FF8855", aliases: [] },
  { name: "--orange-500", hex: "#FF6A2B", aliases: [] },
  { name: "--orange-600", hex: "#DE5B23", aliases: [] },
  { name: "--orange-700", hex: "#C14D1C", aliases: [] },
  { name: "--orange-800", hex: "#A13E15", aliases: [] },
  { name: "--orange-900", hex: "#84300E", aliases: [] },

  // Status colours
  { name: "--success-surface", hex: "#E6F4EC", aliases: [] },
  { name: "--success-text", hex: "#0B5C38", aliases: [] },
  { name: "--success-accent", hex: "#0F7A4A", aliases: [] },
  { name: "--warning-surface", hex: "#FFF4E0", aliases: [] },
  { name: "--warning-text", hex: "#7A4A00", aliases: [] },
  { name: "--warning-accent", hex: "#B26B00", aliases: [] },
  { name: "--danger-surface", hex: "#FDECEA", aliases: [] },
  { name: "--danger-text", hex: "#A1180F", aliases: [] },
  { name: "--danger-accent", hex: "#C62828", aliases: [] },
  { name: "--info-surface", hex: "#E8EEFB", aliases: [] },

  // High-contrast mode's own two colours (design §5.3, §15.2)
  { name: "--hc-text", hex: "#0A0A0A", aliases: [] },
  { name: "--hc-sidebar", hex: "#000000", aliases: [] },
];

/**
 * The neutral ramp (design §5.1) is not a fourth palette: every step is an
 * alias of a dusk or navy step with the same hex. Kept here, as data, so the
 * *purpose* of each grey is written down even though no separate CSS
 * variable is declared for it.
 */
export const NEUTRAL_RAMP_ALIASES: { name: string; aliasOf: string; use: string }[] = [
  { name: "--neutral-0", aliasOf: "#FFFFFF", use: "page and card background" },
  { name: "--neutral-50", aliasOf: "--dusk-50", use: "zebra rows, subtle panels" },
  { name: "--neutral-100", aliasOf: "--dusk-100", use: "table header tint, toolbar strip" },
  { name: "--neutral-200", aliasOf: "--dusk-200", use: "hairline dividers, progress-bar track" },
  { name: "--neutral-300", aliasOf: "--dusk-300", use: "decorative card border, selected row fill" },
  { name: "--neutral-500", aliasOf: "--dusk-700", use: "border-strong: input, select and checkbox outlines" },
  { name: "--neutral-700", aliasOf: "--navy-400", use: "muted / secondary text" },
  { name: "--neutral-900", aliasOf: "--navy-900", use: "primary text" },
];

export type Pairing = {
  row: string;
  usage: string;
  fg: string;
  bg: string;
  ratio: number;
  threshold: 3 | 4.5 | null;
  expect: "pass" | "fail";
};

export const PAIRINGS: Pairing[] = [
  { row: "1", usage: "Body text, headings on a card", fg: "#0D1A33", bg: "#FFFFFF", ratio: 17.32, threshold: 4.5, expect: "pass" },
  { row: "2", usage: "Body text on the page background", fg: "#0D1A33", bg: "#F8FAFD", ratio: 16.56, threshold: 4.5, expect: "pass" },
  { row: "3", usage: "Table header text on the dusk tint", fg: "#0D1A33", bg: "#F0F3FB", ratio: 15.60, threshold: 4.5, expect: "pass" },
  { row: "4", usage: "Text on the neutral status pair: Pending, Adjustment", fg: "#0D1A33", bg: "#E0E7F6", ratio: 13.96, threshold: 4.5, expect: "pass" },
  { row: "5", usage: "Text on a selected / hovered row", fg: "#0D1A33", bg: "#CBD6F0", ratio: 11.89, threshold: 4.5, expect: "pass" },
  { row: "6", usage: "Muted helper text on white", fg: "#4D5E80", bg: "#FFFFFF", ratio: 6.50, threshold: 4.5, expect: "pass" },
  { row: "7", usage: "Muted helper text on the dusk tint", fg: "#4D5E80", bg: "#F0F3FB", ratio: 5.86, threshold: 4.5, expect: "pass" },
  { row: "8", usage: "Muted text on a zebra row", fg: "#4D5E80", bg: "#F8FAFD", ratio: 6.22, threshold: 4.5, expect: "pass" },
  { row: "9", usage: "Orange link / inline orange text", fg: "#C14D1C", bg: "#FFFFFF", ratio: 4.83, threshold: 4.5, expect: "pass" },
  { row: "10", usage: "Orange link on a zebra row", fg: "#C14D1C", bg: "#F8FAFD", ratio: 4.62, threshold: 4.5, expect: "pass" },
  { row: "11", usage: "Orange text on the header tint — rejected", fg: "#C14D1C", bg: "#F0F3FB", ratio: 4.35, threshold: 4.5, expect: "fail" },
  { row: "11a", usage: "Orange text on the header tint — adopted", fg: "#A13E15", bg: "#F0F3FB", ratio: 5.88, threshold: 4.5, expect: "pass" },
  { row: "12", usage: "Primary button label on the orange fill", fg: "#0D1A33", bg: "#FF6A2B", ratio: 6.06, threshold: 4.5, expect: "pass" },
  { row: "13", usage: "Primary button edge against the page", fg: "#C14D1C", bg: "#FFFFFF", ratio: 4.83, threshold: 3, expect: "pass" },
  { row: "14", usage: "Primary button fill against the page — why the edge exists", fg: "#FF6A2B", bg: "#FFFFFF", ratio: 2.86, threshold: 3, expect: "fail" },
  { row: "15", usage: "Hovered primary button label", fg: "#0D1A33", bg: "#DE5B23", ratio: 4.64, threshold: 4.5, expect: "pass" },
  { row: "16", usage: "Destructive button label", fg: "#FFFFFF", bg: "#C62828", ratio: 5.62, threshold: 4.5, expect: "pass" },
  { row: "17", usage: "Input / select / checkbox outline", fg: "#65769D", bg: "#FFFFFF", ratio: 4.53, threshold: 3, expect: "pass" },
  { row: "18", usage: "Input outline inside a tinted card", fg: "#65769D", bg: "#F0F3FB", ratio: 4.08, threshold: 3, expect: "pass" },
  { row: "19", usage: "Focus ring on light surfaces", fg: "#C14D1C", bg: "#FFFFFF", ratio: 4.83, threshold: 3, expect: "pass" },
  { row: "20", usage: "Focus ring inside the sidebar", fg: "#FF8855", bg: "#0D1A33", ratio: 7.34, threshold: 3, expect: "pass" },
  { row: "21", usage: "Sidebar primary text / nav labels", fg: "#FFFFFF", bg: "#0D1A33", ratio: 17.32, threshold: 4.5, expect: "pass" },
  { row: "22", usage: "Sidebar secondary text (Job & Inventory System)", fg: "#E0E7F6", bg: "#0D1A33", ratio: 13.96, threshold: 4.5, expect: "pass" },
  { row: "23", usage: "Sidebar muted text (dashed feedback box)", fg: "#B4C4E9", bg: "#0D1A33", ratio: 9.91, threshold: 4.5, expect: "pass" },
  { row: "24", usage: "Sidebar hover row label", fg: "#FFFFFF", bg: "#1F2C48", ratio: 13.89, threshold: 4.5, expect: "pass" },
  { row: "25", usage: "Sidebar dividers / dashed border", fg: "#8295C0", bg: "#0D1A33", ratio: 5.78, threshold: 3, expect: "pass" },
  { row: "26", usage: "Low-stock count badge in the sidebar (fill vs navy)", fg: "#FF6A2B", bg: "#0D1A33", ratio: 6.06, threshold: 3, expect: "pass" },
  { row: "27", usage: "Low-stock badge number on that fill", fg: "#0D1A33", bg: "#FF6A2B", ratio: 6.06, threshold: 4.5, expect: "pass" },
  { row: "28", usage: "In Stock chip text and icon", fg: "#0B5C38", bg: "#E6F4EC", ratio: 7.12, threshold: 4.5, expect: "pass" },
  { row: "29", usage: "In Stock chip border", fg: "#0F7A4A", bg: "#FFFFFF", ratio: 5.38, threshold: 3, expect: "pass" },
  { row: "30", usage: "Low Stock chip text and icon", fg: "#7A4A00", bg: "#FFF4E0", ratio: 6.86, threshold: 4.5, expect: "pass" },
  { row: "31", usage: "Low Stock chip border", fg: "#B26B00", bg: "#FFFFFF", ratio: 4.20, threshold: 3, expect: "pass" },
  { row: "32", usage: "Out of Stock chip text and icon", fg: "#A1180F", bg: "#FDECEA", ratio: 6.92, threshold: 4.5, expect: "pass" },
  { row: "33", usage: "Out of Stock chip border", fg: "#C62828", bg: "#FFFFFF", ratio: 5.62, threshold: 3, expect: "pass" },
  { row: "34", usage: "The info status pair: In Progress chip text and icon", fg: "#1F2C48", bg: "#E8EEFB", ratio: 11.94, threshold: 4.5, expect: "pass" },
  { row: "34a", usage: "info chip border against white", fg: "#65769D", bg: "#FFFFFF", ratio: 4.53, threshold: 3, expect: "pass" },
  { row: "34b", usage: "neutral chip border against white", fg: "#65769D", bg: "#FFFFFF", ratio: 4.53, threshold: 3, expect: "pass" },
  { row: "35", usage: "Chip label on a warning banner surface", fg: "#0D1A33", bg: "#FFF4E0", ratio: 15.89, threshold: 4.5, expect: "pass" },
  { row: "36", usage: "Chip label on a danger banner surface", fg: "#0D1A33", bg: "#FDECEA", ratio: 15.14, threshold: 4.5, expect: "pass" },
  { row: "37", usage: "Progress bar: completed segment vs track", fg: "#0F7A4A", bg: "#E0E7F6", ratio: 4.34, threshold: 3, expect: "pass" },
  { row: "38", usage: "Progress bar: in-progress segment vs track", fg: "#C14D1C", bg: "#E0E7F6", ratio: 3.90, threshold: 3, expect: "pass" },
  { row: "39", usage: "Progress bar: pending segment vs track", fg: "#4D5E80", bg: "#E0E7F6", ratio: 5.24, threshold: 3, expect: "pass" },
  { row: "40", usage: "Progress bar: orange-500 vs track — rejected", fg: "#FF6A2B", bg: "#E0E7F6", ratio: 2.30, threshold: 3, expect: "fail" },
  { row: "41", usage: "Disabled control label (kept readable on purpose)", fg: "#4D5E80", bg: "#F0F3FB", ratio: 5.86, threshold: null, expect: "pass" },
  { row: "42", usage: "Dusk Blue as text on white — forbidden pairing, never used", fg: "#9FB4E3", bg: "#FFFFFF", ratio: 2.08, threshold: 4.5, expect: "fail" },
  { row: "43", usage: "Dusk-300 hairline as a control outline — forbidden, decorative only", fg: "#CBD6F0", bg: "#FFFFFF", ratio: 1.46, threshold: 3, expect: "fail" },
  { row: "44", usage: "High-contrast mode: body text", fg: "#0A0A0A", bg: "#FFFFFF", ratio: 19.80, threshold: 4.5, expect: "pass" },
  { row: "45", usage: "High-contrast mode: primary button", fg: "#FFFFFF", bg: "#84300E", ratio: 8.71, threshold: 4.5, expect: "pass" },
  { row: "46", usage: "High-contrast mode: sidebar text", fg: "#FFFFFF", bg: "#000000", ratio: 21.00, threshold: 4.5, expect: "pass" },
  { row: "47", usage: "High-contrast mode: control outline", fg: "#0D1A33", bg: "#FFFFFF", ratio: 17.32, threshold: 3, expect: "pass" },
  { row: "48", usage: "outline / secondary button edge against a card", fg: "#65769D", bg: "#FFFFFF", ratio: 4.53, threshold: 3, expect: "pass" },
  { row: "49", usage: "Control outline against the page (outline/secondary edge, or an input/select outside a card)", fg: "#65769D", bg: "#F8FAFD", ratio: 4.34, threshold: 3, expect: "pass" },
  { row: "50", usage: "secondary fill alone against white — why the edge exists", fg: "#E0E7F6", bg: "#FFFFFF", ratio: 1.24, threshold: 3, expect: "fail" },
  { row: "51", usage: "secondary fill alone against the page — same reason", fg: "#E0E7F6", bg: "#F8FAFD", ratio: 1.19, threshold: 3, expect: "fail" },
  { row: "52", usage: "High-contrast mode: muted text on a muted surface", fg: "#1F2C48", bg: "#FFFFFF", ratio: 13.89, threshold: 4.5, expect: "pass" },
];
