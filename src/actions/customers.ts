"use server";

import { revalidatePath } from "next/cache";

import { getServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { mapSupabaseError, type ActionResult } from "@/lib/errors";
import { CustomerSchema, type CustomerFormValues } from "@/schemas/customer";
import { findDuplicateCustomer, type CustomerRow } from "@/lib/queries/customers";

/**
 * `customers` has an unrestricted `insert`/`update` grant for staff
 * (design §10's grants matrix — it carries no generated code and no
 * money column, so there is nothing a function would be protecting), so
 * these actions write through PostgREST directly rather than an RPC.
 * They still re-check `is_staff()`-equivalent here: RLS is the layer that
 * cannot be bypassed, but Requirement 3.10 asks for a human-readable
 * refusal from the UI layer too, not a generic `permission denied`.
 */
function isStaff(role: string): boolean {
  return role === "owner" || role === "admin_staff";
}

function toNullable(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createCustomer(values: CustomerFormValues): Promise<ActionResult<CustomerRow>> {
  const parsed = CustomerSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  const profile = await requireUser();
  if (!isStaff(profile.role)) return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: parsed.data.name,
      phone: toNullable(parsed.data.phone),
      address: toNullable(parsed.data.address),
      notes: toNullable(parsed.data.notes),
      created_by: profile.id,
    })
    .select("id, name, phone, address, notes, created_at")
    .single();

  if (error || !data) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/customers");
  revalidatePath("/jobs");
  return { ok: true, data: data as CustomerRow };
}

export async function updateCustomer(
  id: string,
  values: CustomerFormValues,
): Promise<ActionResult<CustomerRow>> {
  const parsed = CustomerSchema.safeParse(values);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  const profile = await requireUser();
  if (!isStaff(profile.role)) return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: toNullable(parsed.data.phone),
      address: toNullable(parsed.data.address),
      notes: toNullable(parsed.data.notes),
    })
    .eq("id", id)
    .select("id, name, phone, address, notes, created_at")
    .single();

  if (error || !data) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/customers");
  revalidatePath("/jobs");
  return { ok: true, data: data as CustomerRow };
}

/** Soft delete, symmetrical with `restoreCustomer` (design §13.5) — keeps Undo a plain `set deleted_at = null`. */
export async function softDeleteCustomer(id: string): Promise<ActionResult<{ id: string }>> {
  const profile = await requireUser();
  if (!isStaff(profile.role)) return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { error } = await supabase.from("customers").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/customers");
  return { ok: true, data: { id } };
}

export async function restoreCustomer(id: string): Promise<ActionResult<{ id: string }>> {
  const profile = await requireUser();
  if (!isStaff(profile.role)) return { ok: false, code: "NOT_PERMITTED" };

  const supabase = await getServerClient();
  const { error } = await supabase.from("customers").update({ deleted_at: null }).eq("id", id);
  if (error) return { ok: false, code: mapSupabaseError(error) };

  revalidatePath("/customers");
  return { ok: true, data: { id } };
}

/** Requirement 9.11: the non-blocking duplicate check the customer form runs before saving a new record. */
export async function checkDuplicateCustomer(name: string, phone: string): Promise<CustomerRow | null> {
  await requireUser();
  const supabase = await getServerClient();
  return findDuplicateCustomer(supabase, name, phone);
}
