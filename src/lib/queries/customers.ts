import type { SupabaseClient } from "@supabase/supabase-js";

import { PAGE_SIZE } from "@/lib/constants";
import { esc } from "@/lib/queries/_filter";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

export async function listCustomers(
  supabase: SupabaseClient,
  params: { q?: string; page?: number },
): Promise<{ rows: CustomerRow[]; totalCount: number }> {
  const page = Math.max(1, params.page ?? 1);

  let query = supabase
    .from("customers")
    .select("id, name, phone, address, notes, created_at", { count: "exact" })
    .is("deleted_at", null);

  if (params.q) {
    const q = esc(params.q);
    if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  query = query.order("name", { ascending: true }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: (data ?? []) as CustomerRow[], totalCount: count ?? 0 };
}

/** Every active customer, for the job form's customer picker — the shop is small enough that this stays a plain select, not a searchable combobox (brief ADDENDUM 2: no speculative abstraction). */
export async function listAllCustomers(supabase: SupabaseClient): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}

/** Requirement 9.11: a non-blocking duplicate warning when name and phone both match an existing customer. */
export async function findDuplicateCustomer(
  supabase: SupabaseClient,
  name: string,
  phone: string,
): Promise<CustomerRow | null> {
  if (!phone) return null;
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, address, notes, created_at")
    .is("deleted_at", null)
    .ilike("name", name.trim())
    .eq("phone", phone.trim())
    .maybeSingle();
  if (error) return null;
  return (data as CustomerRow | null) ?? null;
}
