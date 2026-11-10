import type { CookieOptions } from "@supabase/ssr";

/**
 * "Remember me" controls cookie *lifetime*, not token lifetime (design
 * §14.2, Requirement 1.9): ticked means the auth cookies carry a 30-day
 * `maxAge`, unticked means session cookies that die with the browser.
 *
 * Applying that choice only in the sign-in action would not survive the
 * first token refresh — `src/proxy.ts` re-writes the same auth cookies on
 * every request, using whatever options `@supabase/ssr` hands its
 * `setAll`, which knows nothing about a tick box the user touched minutes
 * earlier. So the choice is stored in its own non-sensitive cookie
 * (`rjm_remember`, written by the sign-in action) and every cookie writer
 * — this action and the proxy — maps every cookie through this one
 * helper.
 */
export function authCookieOptions(remember: boolean, options: CookieOptions = {}): CookieOptions {
  return remember
    ? { ...options, maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax" }
    : { ...options, maxAge: undefined, expires: undefined, path: "/", sameSite: "lax" };
}

export const REMEMBER_COOKIE = "rjm_remember";

/**
 * Preferences are mirrored into two cookies on save (design §15.1):
 * `locale` (read by `src/i18n/request.ts`) and `rjm_prefs` (read by the
 * root layout before the session is resolved, and by the login page,
 * which has no profile to read). 400 days, like `rjm_remember`, so a
 * returning visitor's choice survives far longer than any session.
 */
export const LOCALE_COOKIE = "locale";
export const PREFS_COOKIE = "rjm_prefs";
export const PREFS_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;
