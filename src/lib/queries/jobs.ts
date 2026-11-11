import type { SupabaseClient } from "@supabase/supabase-js";

import { PAGE_SIZE } from "@/lib/constants";
import { esc } from "@/lib/queries/_filter";
import type { JobStatus } from "@/schemas/job";

export type JobListRow = {
  id: string;
  job_code: string;
  customer_id: string;
  customer_name: string;
  project_name: string;
  description: string | null;
  order_date: string;
  expected_completion: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  status: JobStatus;
  /** Only ever populated for a staff caller (see `listJobQuotedPrices`) — absent, not null, for a worker. */
  quotedPrice?: number;
};

export type ListJobsParams = {
  q?: string;
  status?: string;
  page?: number;
  /** A worker's list is still "all jobs" (Requirement 3.4) — this only scopes a future narrower view if ever needed. */
  assignedTo?: string;
};

/**
 * `/jobs`'s list query (design §3.2, Requirement 8.4-8.6, 8.12): reads
 * `v_jobs_list` so the search can match job code, customer name or
 * project name with one single-table filter instead of a PostgREST
 * cross-resource `.or()`, which the embedding API does not support.
 * Sorted newest order date first (Requirement 8.12).
 */
export async function listJobs(
  supabase: SupabaseClient,
  params: ListJobsParams,
): Promise<{ rows: JobListRow[]; totalCount: number }> {
  const page = Math.max(1, params.page ?? 1);

  let query = supabase.from("v_jobs_list").select("*", { count: "exact" });

  if (params.q) {
    const q = esc(params.q);
    if (q) {
      query = query.or(
        `job_code.ilike.%${q}%,project_name.ilike.%${q}%,customer_name.ilike.%${q}%`,
      );
    }
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.assignedTo) {
    query = query.eq("assigned_to", params.assignedTo);
  }

  query = query
    .order("order_date", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { rows: (data ?? []) as JobListRow[], totalCount: count ?? 0 };
}

export type JobDetailRow = JobListRow & {
  created_at: string | null;
  updated_at: string | null;
};

export async function getJob(supabase: SupabaseClient, id: string): Promise<JobDetailRow | null> {
  const { data, error } = await supabase.from("v_jobs_list").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as JobDetailRow | null) ?? null;
}

/** Staff-only (RLS gated): the quoted price, read separately so a worker's request never asks for it at all. */
export async function getJobQuotedPrice(supabase: SupabaseClient, jobId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from("job_pricing")
    .select("quoted_price")
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) return null; // no policy match for this role — same as "no price set"
  return (data as { quoted_price: number } | null)?.quoted_price ?? null;
}

/**
 * The batch form of the above, for the list's edit dialog (the Job
 * Orders list itself never shows a price column — Requirement 8.4 fixes
 * eight columns and a price is not one of them — but editing a job needs
 * its current price pre-filled). The caller is expected to skip this
 * call entirely for a worker, so the request is never made in that
 * session at all, not merely filtered after the fact.
 */
export async function listJobQuotedPrices(
  supabase: SupabaseClient,
  jobIds: string[],
): Promise<Record<string, number>> {
  if (jobIds.length === 0) return {};
  const { data, error } = await supabase.from("job_pricing").select("job_id, quoted_price").in("job_id", jobIds);
  if (error) return {};
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as { job_id: string; quoted_price: number }[]) {
    map[row.job_id] = row.quoted_price;
  }
  return map;
}

export type JobStatusHistoryRow = {
  id: number;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
};

/** Requirement 9.12: everyone signed in may read a job's status history. */
export async function listJobStatusHistory(supabase: SupabaseClient, jobId: string): Promise<JobStatusHistoryRow[]> {
  const { data, error } = await supabase
    .from("job_status_history")
    .select("id, from_status, to_status, changed_by, changed_at")
    .eq("job_id", jobId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobStatusHistoryRow[];
}

export type JobMaterialRow = {
  id: string;
  txn_code: string;
  material_name: string;
  quantity: number;
  unit: string;
  created_at: string;
};

/** Requirement 9.12: the materials issued to a job are its `stock_out` rows. No cost column — `v_transactions_list` carries none. */
export async function listJobMaterials(supabase: SupabaseClient, jobId: string): Promise<JobMaterialRow[]> {
  const { data, error } = await supabase
    .from("v_transactions_list")
    .select("id, txn_code, material_name, quantity, unit, created_at")
    .eq("job_id", jobId)
    .eq("type", "stock_out")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobMaterialRow[];
}
