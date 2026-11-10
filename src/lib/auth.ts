import { getServerClient } from "@/lib/supabase/server";

/**
 * The cheap claims-only check `src/app/page.tsx` uses to decide between
 * `/dashboard` and `/login` (design §3.1). No profile load — that is
 * `requireUser()`'s job, added in task 1.11.
 */
export async function isSignedIn(): Promise<boolean> {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}
