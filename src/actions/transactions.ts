"use server";

import { revalidatePath } from "next/cache";

import { getServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { mapSupabaseError, parseErrorDetail, type ActionResult } from "@/lib/errors";
import { StockInSchema, buildStockOutSchema, type StockInFormValues, type StockOutFormValues } from "@/schemas/transaction";

export type StockMovementResult = {
  transaction_id: string;
  txn_code: string;
  new_stock: number;
  material_name: string;
  unit: string;
};

function revalidateAfterMovement(jobId?: string | null) {
  revalidatePath("/transactions");
  revalidatePath("/inventory");
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  if (jobId) revalidatePath(`/jobs/${jobId}`);
}

/**
 * Calls `record_stock_movement` (design §12) for "Record Stock In" —
 * type-aware: a plain `stock_in`, or the `adjustment` correction path
 * Requirement 11.9 asks for. Never re-implements the row lock, the
 * 11-step algorithm or the `is_staff()` gate the RPC already owns.
 */
export async function recordStockIn(values: StockInFormValues): Promise<ActionResult<StockMovementResult>> {
  const parsed = StockInSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  await requireUser();
  const supabase = await getServerClient();

  const { data, error } = await supabase.rpc("record_stock_movement", {
    p_material_id: parsed.data.material_id,
    p_type: parsed.data.type,
    p_quantity: Number(parsed.data.quantity),
    p_reason: parsed.data.reason,
    p_direction: parsed.data.type === "adjustment" ? (Number(parsed.data.direction) as 1 | -1) : null,
  });

  if (error) return { ok: false, code: mapSupabaseError(error), detail: parseErrorDetail(error) };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, code: "UNEXPECTED" };

  revalidateAfterMovement();
  return { ok: true, data: row as StockMovementResult };
}

/**
 * Calls `record_stock_movement` for "Record Stock Out" — available to
 * every role (Requirement 11.10). `jobRequired` comes from the caller,
 * which already knows the signed-in role; this action re-validates with
 * the same rule rather than trusting the client sent a job id.
 */
export async function recordStockOut(
  values: StockOutFormValues,
  jobRequired: boolean,
): Promise<ActionResult<StockMovementResult>> {
  const parsed = buildStockOutSchema(jobRequired).safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  await requireUser();
  const supabase = await getServerClient();

  const jobId = parsed.data.job_id?.trim() || null;
  const reason = parsed.data.reason?.trim() || null;

  const { data, error } = await supabase.rpc("record_stock_movement", {
    p_material_id: parsed.data.material_id,
    p_type: "stock_out",
    p_quantity: Number(parsed.data.quantity),
    p_reason: reason,
    p_job_id: jobId,
  });

  if (error) return { ok: false, code: mapSupabaseError(error), detail: parseErrorDetail(error) };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, code: "UNEXPECTED" };

  revalidateAfterMovement(jobId);
  return { ok: true, data: row as StockMovementResult };
}
