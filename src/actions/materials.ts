"use server";

import { revalidatePath } from "next/cache";

import { getServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { mapSupabaseError, parseErrorDetail, type ActionResult } from "@/lib/errors";
import { MaterialSchema, type MaterialFormValues } from "@/schemas/material";

export type UpsertMaterialResult = { material_id: string; material_code: string; current_stock: number };

/**
 * Calls `upsert_material` (design §13.3) for both create and edit —
 * never re-implements the code generation, the required-unit-cost check
 * or the `is_staff()` gate the RPC already owns. `materialId` is
 * `undefined` (not `null`) on create so the RPC's own `default null`
 * applies.
 */
export async function upsertMaterialAction(
  values: MaterialFormValues,
  materialId?: string,
): Promise<ActionResult<UpsertMaterialResult>> {
  const parsed = MaterialSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  await requireUser();
  const supabase = await getServerClient();

  const { data, error } = await supabase.rpc("upsert_material", {
    p_name: parsed.data.name,
    p_category: parsed.data.category,
    p_unit: parsed.data.unit,
    p_minimum_level: Number(parsed.data.minimum_level),
    p_material_id: materialId,
    p_unit_cost: Number(parsed.data.unit_cost),
    p_opening_stock: parsed.data.opening_stock ? Number(parsed.data.opening_stock) : 0,
  });

  if (error) return { ok: false, code: mapSupabaseError(error), detail: parseErrorDetail(error) };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { ok: false, code: "UNEXPECTED" };

  revalidatePath("/inventory");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return {
    ok: true,
    data: {
      material_id: row.material_id as string,
      material_code: row.material_code as string,
      current_stock: row.current_stock as number,
    },
  };
}

/**
 * Soft delete/restore through the plain `materials_update_staff` grant
 * (design §13.5) — symmetrical with jobs/customers, so Undo stays a
 * plain `set deleted_at = null`. Requirement 10.13's extra confirmation
 * when stock is above zero is a UI-only decision (`InventoryPageClient`
 * already has the row's `current_stock`), so this action does not need
 * to know the quantity.
 */
export async function softDeleteMaterial(materialId: string): Promise<ActionResult<{ id: string }>> {
  const profile = await requireUser();
  if (profile.role === "worker") return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { error } = await supabase.from("materials").update({ deleted_at: new Date().toISOString() }).eq("id", materialId);
  if (error) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/inventory");
  return { ok: true, data: { id: materialId } };
}

export async function restoreMaterial(materialId: string): Promise<ActionResult<{ id: string }>> {
  const profile = await requireUser();
  if (profile.role === "worker") return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { error } = await supabase.from("materials").update({ deleted_at: null }).eq("id", materialId);
  if (error) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/inventory");
  return { ok: true, data: { id: materialId } };
}
