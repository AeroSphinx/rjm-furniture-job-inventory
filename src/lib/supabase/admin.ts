import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { publicEnv, requireSecretKey } from "@/lib/env";

// TODO(Phase 2, task 2.16): parametrize with the generated `Database` type.
/**
 * The admin client, built with the secret key. `import "server-only"` makes
 * importing this file from a client component a build error (Requirement
 * 26.5). Used only by `api/admin/users/route.ts`, the login username
 * lookup (`src/actions/auth.ts`) and `scripts/seed.ts` — nowhere else.
 * `requireSecretKey()` throws a clear error naming the missing variable if
 * `SUPABASE_SECRET_KEY` has not been pasted into `.env.local` yet.
 */
export function createAdminClient() {
  return createSupabaseClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, requireSecretKey(), {
    auth: { persistSession: false },
  });
}
