import { cache } from "react";
import { z } from "zod";

import { getServerClient } from "@/lib/supabase/server";

/**
 * `dashboard_summary()`'s payload contract (design §13.6): the function
 * returns `jsonb`, so without a written schema the Dashboard's three
 * streaming sections could each invent different key names. Parsed once
 * here; a parse failure is a developer error, not a user-facing one, and
 * surfaces as the section's `ErrorCard` (design §18.3).
 */
export const DashboardSummarySchema = z.object({
  jobs_total: z.number().int(),
  jobs_pending: z.number().int(),
  jobs_in_progress: z.number().int(),
  jobs_completed: z.number().int(),
  jobs_on_hold: z.number().int(),
  jobs_this_month: z.number().int(),
  due_this_week: z.number().int(),
  completion_rate: z.number(),
  materials_total: z.number().int(),
  category_count: z.number().int(),
  low_stock_count: z.number().int(),
  out_of_stock_count: z.number().int(),
  txn_this_month: z.number().int(),
  recent_jobs: z.array(
    z.object({
      id: z.string(),
      job_code: z.string(),
      customer_name: z.string(),
      project_name: z.string(),
      expected_completion: z.string().nullable(),
      status: z.enum(["pending", "in_progress", "on_hold", "completed"]),
    }),
  ),
  recent_transactions: z.array(
    z.object({
      id: z.string(),
      txn_code: z.string(),
      material_name: z.string(),
      type: z.enum(["stock_in", "stock_out", "adjustment"]),
      quantity: z.number(),
      unit: z.string(),
      job_code: z.string().nullable(),
      created_at: z.string(),
    }),
  ),
});
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

/**
 * One round trip for the whole Dashboard (Requirement 7.6). `cache()`
 * means the three `<Suspense>` sections in `/dashboard` can each call
 * this and still cost one request — React dedupes repeated calls with
 * the same arguments within a single render pass.
 */
export const getDashboardSummary = cache(async (): Promise<DashboardSummary> => {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc("dashboard_summary");
  if (error) throw error;
  return DashboardSummarySchema.parse(data);
});
