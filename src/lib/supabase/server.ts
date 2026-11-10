import { cache } from "react";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";
import { authCookieOptions, REMEMBER_COOKIE } from "@/lib/supabase/cookie-options";

// TODO(Phase 2, task 2.16): parametrize with the generated `Database` type.
/**
 * For server components, server actions and route handlers. Wrapped in
 * React `cache()` so one request reuses one client (design §14.1). Uses
 * the current `@supabase/ssr` `getAll`/`setAll` cookie adapter — the older
 * `get`/`set`/`remove` adapter is not used anywhere in this project.
 */
export const getServerClient = cache(async () => {
  const store = await cookies();

  // "Remember me" controls cookie lifetime, not token lifetime (design
  // §14.2). This cookie holds no identity and no token, so reading it here
  // is safe even before `getClaims()` has verified anything.
  const remember = store.get(REMEMBER_COOKIE)?.value !== "0";

  return createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, authCookieOptions(remember, options)));
        } catch {
          // Called from a Server Component render, where cookies cannot be
          // written. The proxy has already refreshed the session cookies
          // for this request, so there is nothing to do here.
        }
      },
    },
  });
});
