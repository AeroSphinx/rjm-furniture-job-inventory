import { z } from "zod";

/** The shop's fixed category list (materials table check constraint, design §13.3). Kept in English in both languages — a workshop vocabulary term, not prose. */
export const MATERIAL_CATEGORIES = [
  "Lumber",
  "Plywood",
  "Fasteners",
  "Adhesives",
  "Finishing",
  "Hardware",
  "Consumables",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/** The shop's fixed unit list (materials table check constraint). Kept in English in both languages, per the brief's addendum B. */
export const MATERIAL_UNITS = ["board ft", "sheets", "kg", "liters", "boxes", "pairs", "pieces"] as const;
export type MaterialUnit = (typeof MATERIAL_UNITS)[number];

function isNonNegativeNumber(value: string): boolean {
  if (value.trim() === "") return false;
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

/**
 * The material create/edit form (Requirement 10.6-10.8, design §13.3).
 * `unit_cost` is required — this screen only ever opens for Owner and
 * Admin (Requirement 10.9 keeps a worker off it entirely), so there is no
 * role branch inside the schema itself. `opening_stock` is honoured by
 * `upsert_material` on create only; the form still validates it either
 * way so a typo is caught before the RPC call.
 */
export const MaterialSchema = z.object({
  name: z.string().trim().min(2, { message: "Validation.nameTooShort" }).max(120),
  category: z.enum(MATERIAL_CATEGORIES, { message: "Validation.categoryRequired" }),
  unit: z.enum(MATERIAL_UNITS, { message: "Validation.unitRequired" }),
  minimum_level: z
    .string()
    .trim()
    .refine(isNonNegativeNumber, { message: "Validation.minimumLevelInvalid" }),
  unit_cost: z
    .string()
    .trim()
    .refine(isNonNegativeNumber, { message: "Validation.unitCostInvalid" }),
  opening_stock: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || isNonNegativeNumber(v), { message: "Validation.openingStockInvalid" }),
});

export type MaterialFormValues = z.infer<typeof MaterialSchema>;
