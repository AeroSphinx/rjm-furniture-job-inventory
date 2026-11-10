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
