import type { SupabaseClient } from "@supabase/supabase-js";

export type AssignableProfile = {
  id: string;
  full_name: string;
  role: string;
};

/**
 * The "Assigned Worker" dropdown's options (design §20's Job Orders
 * wireframe rows name the owner and admin staff as assignees too, not
 * only carpenters — a job's responsible person can be anyone on staff).
 * `profiles_select_all`'s column grant omits `email`, so this only ever
 * asks for the columns that grant actually allows.
 */
export async function listAssignableProfiles(supabase: SupabaseClient): Promise<AssignableProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .is("deactivated_at", null)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AssignableProfile[];
}
