import type { SupabaseClient } from "@supabase/supabase-js";

import { PAGE_SIZE } from "@/lib/constants";
import { esc } from "@/lib/queries/_filter";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type MaterialListRow = {
  id: string;
  material_code: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_level: number;
  stock_status: StockStatus;
};

/**
 * `/inventory`'s list query (Requirement 10.1-10.11): reads
 * `v_material_status` (design §7.3, §13.6) so stock status is always
 * derived from live data through the view's one SQL expression, never
 * recomputed here. The view carries no cost column, so this query is
 * safe for every role.
 */
export async function listMaterials(
  supabase: SupabaseClient,
  params: { q?: string; category?: string; page?: number },
): Promise<{ rows: MaterialListRow[]; totalCount: number }> {
  const page = Math.max(1, params.page ?? 1);

  let query = supabase.from("v_material_status").select("*", { count: "exact" });

  if (params.q) {
    const q = esc(params.q);
    if (q) {
      query = query.or(`material_code.ilike.%${q}%,name.ilike.%${q}%`);
    }
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }

  query = query.order("name", { ascending: true }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { rows: (data ?? []) as MaterialListRow[], totalCount: count ?? 0 };
}

/** Requirement 10.4's banner count: the unfiltered total across the whole table, not just the current page — the same source (`v_material_status`) the sidebar badge already reads in `(app)/layout.tsx`. */
export async function countMaterialsNeedingAttention(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("v_material_status")
    .select("id", { count: "exact", head: true })
    .in("stock_status", ["out_of_stock", "low_stock"]);
  if (error) throw error;
  return count ?? 0;
}

export type MaterialDetailRow = {
  id: string;
  material_code: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_level: number;
};

/** The material edit form's prefill (no cost — see `getMaterialCost`). */
export async function getMaterial(supabase: SupabaseClient, id: string): Promise<MaterialDetailRow | null> {
  const { data, error } = await supabase
    .from("materials")
    .select("id, material_code, name, category, unit, current_stock, minimum_level")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as MaterialDetailRow | null) ?? null;
}

/**
 * The batch form, for the Inventory list's edit dialog (the list itself
 * never shows a cost column — Requirement 10.5 fixes eight columns and a
 * cost is not one of them — but editing a material needs its current
 * cost pre-filled). Staff-only (RLS gated); the caller is expected to
 * skip this call entirely for a worker, same shape as
 * `listJobQuotedPrices` in `queries/jobs.ts`.
 */
export async function listMaterialCosts(
  supabase: SupabaseClient,
  materialIds: string[],
): Promise<Record<string, number>> {
  if (materialIds.length === 0) return {};
  const { data, error } = await supabase.from("material_costs").select("material_id, unit_cost").in("material_id", materialIds);
  if (error) return {};
  const map: Record<string, number> = {};
  for (const row of (data ?? []) as { material_id: string; unit_cost: number }[]) {
    map[row.material_id] = row.unit_cost;
  }
  return map;
}

export type MaterialOption = {
  id: string;
  material_code: string;
  name: string;
  unit: string;
  current_stock: number;
};

/**
 * The Stock In / Stock Out forms' material picker. Every active
 * material, not paginated — the shop's catalogue is small enough that
 * this stays a plain select rather than a searchable combobox (brief
 * ADDENDUM 2: no speculative abstraction), same reasoning as
 * `listAllCustomers`.
 */
export async function listMaterialOptions(supabase: SupabaseClient): Promise<MaterialOption[]> {
  const { data, error } = await supabase
    .from("v_material_status")
    .select("id, material_code, name, unit, current_stock")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MaterialOption[];
}
