import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

// TODO(Phase 2, task 2.16): parametrize with the generated `Database` type
// once `npm run types` has something to generate from.
/** For client components. Reads only the publishable key, never the secret key. */
export function createClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
