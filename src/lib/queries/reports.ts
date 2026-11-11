import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * `report_summary(p_from, p_to)`'s payload contract (design §13.6,
 * `supabase/migrations/0010_views_and_reporting.sql`). Percentages are
 * not part of the RPC's own jsonb (it returns counts only), so the
 * caller computes them — Requirement 14.4 asks for "count and the share
 * of all jobs as a percentage," not for a specific layer to own the
 * division.
 */
export const ReportSummarySchema = z.object({
  jobs_total: z.number().int(),
  jobs_completed: z.number().int(),
  jobs_pending: z.number().int(),
  jobs_in_progress: z.number().int(),
  materials_total: z.number().int(),
  category_count: z.number().int(),
  low_stock_count: z.number().int(),
  txn_in_range: z.number().int(),
  top_materials: z.array(
    z.object({
      material_name: z.string(),
      unit: z.string(),
      total_quantity: z.number(),
    }),
  ),
  low_stock: z.array(
    z.object({
      material_name: z.string(),
      material_code: z.string(),
      current_stock: z.number(),
      minimum_level: z.number(),
      unit: z.string(),
      stock_status: z.enum(["in_stock", "low_stock", "out_of_stock"]),
    }),
  ),
});
export type ReportSummary = z.infer<typeof ReportSummarySchema>;

/**
 * `/reports`'s one query (Requirement 14.1-14.9): staff-only, enforced a
 * second time inside the function body (`is_staff()`) on top of the
 * route's own `requireRole` (design §13.6) — a worker has no data path
 * to these figures even if it somehow called this.
 */
export async function getReportSummary(
  supabase: SupabaseClient,
  fromIso: string,
  toIso: string,
): Promise<ReportSummary> {
  const { data, error } = await supabase.rpc("report_summary", { p_from: fromIso, p_to: toIso });
  if (error) throw error;
  return ReportSummarySchema.parse(data);
}

/** Requirement 14.4: each tile's share of all jobs in the range, `0` when there are no jobs rather than `NaN`. */
export function sharePercent(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}
