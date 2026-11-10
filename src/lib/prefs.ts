import { cookies } from "next/headers";
import { cache } from "react";

import { getServerClient } from "@/lib/supabase/server";
import { PREFS_COOKIE } from "@/lib/supabase/cookie-options";
import { DEFAULT_PREFERENCES, parsePreferences, type Preferences } from "@/schemas/preferences";

/**
 * The root layout's "profile if signed in, else cookie, else defaults"
 * read (design §15.2). Runs during server rendering, so the very first
 * byte of HTML already carries the user's settings — no flash of the
 * default appearance and no client-side theme script.
 *
 * `cache()`-wrapped so the root layout and any page that also needs the
 * resolved preferences share one read per request.
 */
export const loadPreferences = cache(async (): Promise<Preferences> => {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (claims) {
    try {
      const { data: row, error } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", claims.sub)
        .maybeSingle();
      if (!error && row) {
        return parsePreferences((row as { preferences: unknown }).preferences);
      }
    } catch {
      // `profiles` not reachable yet (pre-Phase-2, or a deactivated/missing
      // row `requireUser()` will catch on the next layout down) — fall
      // through to the cookie.
    }
  }

  const store = await cookies();
  const cookieValue = store.get(PREFS_COOKIE)?.value;
  if (cookieValue) {
    return parsePreferences(cookieValue);
  }

  return DEFAULT_PREFERENCES;
});
