"use server";

import { revalidatePath } from "next/cache";

import { getServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { mapSupabaseError, type ActionResult } from "@/lib/errors";
import { JobSchema, JobStatusSchema, type JobFormValues, type JobStatusFormValues } from "@/schemas/job";

function toNullableString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toNullableNumber(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

export type CreateJobResult = { job_id: string; job_code: string };

/**
 * Calls `create_job_order` (design §13.1) — never re-implements the
 * heal-then-retry code generation or the `is_staff()` gate client-side.
 * Zod has already validated everything `safeParse` can check; the RPC
 * re-validates the same fields on its own ground (a definer function
 * cannot assume the client did) and is the single source of truth for
 * `NOT_PERMITTED`, `CUSTOMER_NOT_FOUND`, `ASSIGNEE_NOT_FOUND` and
 * `CODE_GENERATION_FAILED`.
 */
export async function createJobOrder(values: JobFormValues): Promise<ActionResult<CreateJobResult>> {
  const parsed = JobSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  await requireUser();
  const supabase = await getServerClient();

  const { data, error } = await supabase.rpc("create_job_order", {
    p_customer_id: parsed.data.customer_id,
    p_project_name: parsed.data.project_name,
    p_description: toNullableString(parsed.data.description),
    p_order_date: parsed.data.order_date,
    p_expected_completion: toNullableString(parsed.data.expected_completion),
    p_assigned_to: toNullableString(parsed.data.assigned_to),
    p_status: parsed.data.status,
    p_quoted_price: toNullableNumber(parsed.data.quoted_price),
  });

  if (error) return { ok: false, code: mapSupabaseError(error) };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, code: "UNEXPECTED" };

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { ok: true, data: { job_id: row.job_id as string, job_code: row.job_code as string } };
}

export type UpdateJobResult = { job_id: string; job_code: string; old_status: string; new_status: string };

/** Calls `update_job_order` (design §13.1) — the staff edit path, full field set. */
export async function updateJobOrder(jobId: string, values: JobFormValues): Promise<ActionResult<UpdateJobResult>> {
  const parsed = JobSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  await requireUser();
  const supabase = await getServerClient();

  const quotedPrice = toNullableNumber(parsed.data.quoted_price);
  const { data, error } = await supabase.rpc("update_job_order", {
    p_job_id: jobId,
    p_customer_id: parsed.data.customer_id,
    p_project_name: parsed.data.project_name,
    p_description: toNullableString(parsed.data.description),
    p_order_date: parsed.data.order_date,
    p_expected_completion: toNullableString(parsed.data.expected_completion),
    p_assigned_to: toNullableString(parsed.data.assigned_to),
    p_status: parsed.data.status,
    p_quoted_price: quotedPrice,
    p_clear_price: quotedPrice === null,
  });

  if (error) return { ok: false, code: mapSupabaseError(error) };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, code: "UNEXPECTED" };

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  return {
    ok: true,
    data: {
      job_id: row.job_id as string,
      job_code: row.job_code as string,
      old_status: row.old_status as string,
      new_status: row.new_status as string,
    },
  };
}

export type UpdateStatusResult = { job_id: string; old_status: string; new_status: string };

/**
 * Calls `update_job_status` (design §13.2) — the carpenter's one write,
 * also reused by staff for a quick status-only change from the list.
 * `JOB_NOT_ASSIGNED` and `JOB_COMPLETED` are the RPC's own refusals; the
 * worker's RLS policy is a second, independent lock on the same door
 * (design §18.5).
 */
export async function updateJobStatusAction(
  jobId: string,
  values: JobStatusFormValues,
): Promise<ActionResult<UpdateStatusResult>> {
  const parsed = JobStatusSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  await requireUser();
  const supabase = await getServerClient();

  const { data, error } = await supabase.rpc("update_job_status", {
    p_job_id: jobId,
    p_status: parsed.data.status,
  });

  if (error) return { ok: false, code: mapSupabaseError(error) };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, code: "UNEXPECTED" };

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  return {
    ok: true,
    data: { job_id: row.job_id as string, old_status: row.old_status as string, new_status: row.new_status as string },
  };
}

/**
 * Soft delete/restore go through the plain `jobs_update_staff` grant, not
 * a function (design §13.5 — symmetrical Undo). A worker has no row that
 * matches `jobs_update_staff`'s `is_staff()` condition, so this is
 * refused at the policy layer regardless of what the action itself
 * checks; the action still returns the friendly code rather than a raw
 * `permission denied`.
 */
export async function softDeleteJob(jobId: string): Promise<ActionResult<{ id: string }>> {
  const profile = await requireUser();
  if (profile.role === "worker") return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { error } = await supabase.from("jobs").update({ deleted_at: new Date().toISOString() }).eq("id", jobId);
  if (error) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: jobId } };
}

export async function restoreJob(jobId: string): Promise<ActionResult<{ id: string }>> {
  const profile = await requireUser();
  if (profile.role === "worker") return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { error } = await supabase.from("jobs").update({ deleted_at: null }).eq("id", jobId);
  if (error) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: jobId } };
}
