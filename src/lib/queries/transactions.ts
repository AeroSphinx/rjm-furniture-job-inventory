import type { SupabaseClient } from "@supabase/supabase-js";

import { PAGE_SIZE } from "@/lib/constants";
import { esc } from "@/lib/queries/_filter";
import type { TransactionType } from "@/schemas/transaction";

export type TransactionListRow = {
  id: string;
  txn_code: string;
  material_name: string;
  type: TransactionType;
  quantity: number;
  unit: string;
  reason: string | null;
  job_id: string | null;
  job_code: string | null;
  created_at: string;
};

/**
 * `/transactions`'s list query (Requirement 11.1-11.11): reads
 * `v_transactions_list` (design §7.3) so the search can match
 * transaction code, material name or job code with one single-table
 * filter. Newest first (Requirement 11.11); the view carries no cost
 * column, so this is safe for every role.
 */
export async function listTransactions(
  supabase: SupabaseClient,
  params: { q?: string; type?: string; page?: number },
): Promise<{ rows: TransactionListRow[]; totalCount: number }> {
  const page = Math.max(1, params.page ?? 1);

  let query = supabase.from("v_transactions_list").select("*", { count: "exact" });

  if (params.q) {
    const q = esc(params.q);
    if (q) {
      query = query.or(`txn_code.ilike.%${q}%,material_name.ilike.%${q}%,job_code.ilike.%${q}%`);
    }
  }
  if (params.type) {
    query = query.eq("type", params.type);
  }

  query = query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { rows: (data ?? []) as TransactionListRow[], totalCount: count ?? 0 };
}

export type JobOption = { id: string; job_code: string; project_name: string };

/**
 * The job-order picker for a `stock_out` form (design §20): a worker's
 * list is limited to jobs assigned to them and not completed — the two
 * conditions `record_stock_movement` would otherwise refuse with
 * `JOB_NOT_ASSIGNED`/`JOB_COMPLETED` (Requirement 20.10's
 * error-prevention-at-entry pattern). Completed jobs are excluded for
 * every role: issuing material to a finished job has no legitimate use,
 * even though the RPC itself only refuses it for a worker.
 */
export async function listJobOptionsForStockOut(
  supabase: SupabaseClient,
  opts: { workerId?: string },
): Promise<JobOption[]> {
  let query = supabase.from("v_jobs_list").select("id, job_code, project_name").neq("status", "completed");

  if (opts.workerId) {
    query = query.eq("assigned_to", opts.workerId);
  }

  const { data, error } = await query.order("order_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobOption[];
}
