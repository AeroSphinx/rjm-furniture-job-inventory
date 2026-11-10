"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REMEMBER_COOKIE } from "@/lib/supabase/cookie-options";
import { LoginSchema, type LoginFormValues } from "@/schemas/auth";

export type SignInResult =
  | { ok: true }
  | { ok: false; code: "INVALID_CREDENTIALS" }
  | { ok: false; code: "TOO_MANY_ATTEMPTS"; secondsRemaining: number };

const THROTTLE_COOKIE = "rjm_lf";
const THROTTLE_MAX_ATTEMPTS = 5;
const THROTTLE_WINDOW_MS = 5 * 60 * 1000;

type ThrottleState = { count: number; windowStart: number };

function readThrottle(raw: string | undefined): ThrottleState {
  if (!raw) return { count: 0, windowStart: Date.now() };
  try {
    const parsed = JSON.parse(raw) as ThrottleState;
    if (typeof parsed.count === "number" && typeof parsed.windowStart === "number") {
      return parsed;
    }
  } catch {
    // corrupt cookie — treat as a fresh window
  }
  return { count: 0, windowStart: Date.now() };
}

/**
 * The lookup is deliberately not exposed as an RPC — an endpoint that
 * answers "does this username exist?" is a username oracle, and `anon`
 * has no access to `profiles` at all (design §14.2 step 2). Needs
 * `SUPABASE_SECRET_KEY`, so `requireSecretKey()` inside `createAdminClient`
 * throws politely when it is blank, and the caller degrades to the
 * generic error rather than a 500 page.
 */
async function resolveUsernameToEmail(username: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("username", username.toLowerCase())
    .is("deactivated_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { email: string }).email;
}

/**
 * `src/actions/auth.ts` — the sign-in server action (Requirement 1.4–1.7,
 * 1.9–1.12, 2.5, 2.6). Every failure returns the same generic
 * `INVALID_CREDENTIALS` code: unknown username, unknown email, wrong
 * password, a deactivated account, or an unexpected error (for example the
 * `profiles` table not existing yet before Phase 2's migrations run —
 * nothing here assumes the schema exists, because Phase 1 ships with no
 * schema at all, and this still has to fail safely and quietly).
 */
export async function signIn(values: LoginFormValues): Promise<SignInResult> {
  const store = await cookies();

  // 6. Five-attempts-per-five-minutes throttle. A usability brake, not a
  // security control — stated plainly in the design, because a client can
  // simply clear the cookie. Real rate limiting is GoTrue's job.
  const throttle = readThrottle(store.get(THROTTLE_COOKIE)?.value);
  const windowExpired = Date.now() - throttle.windowStart > THROTTLE_WINDOW_MS;
  const effectiveThrottle = windowExpired ? { count: 0, windowStart: Date.now() } : throttle;

  if (effectiveThrottle.count >= THROTTLE_MAX_ATTEMPTS) {
    const secondsRemaining = Math.ceil(
      (THROTTLE_WINDOW_MS - (Date.now() - effectiveThrottle.windowStart)) / 1000,
    );
    return { ok: false, code: "TOO_MANY_ATTEMPTS", secondsRemaining };
  }

  function recordFailure() {
    const next: ThrottleState = { count: effectiveThrottle.count + 1, windowStart: effectiveThrottle.windowStart };
    store.set(THROTTLE_COOKIE, JSON.stringify(next), { path: "/", maxAge: 60 * 10 });
  }

  const parsed = LoginSchema.safeParse(values);
  if (!parsed.success) {
    recordFailure();
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }
  const { identifier, password, remember } = parsed.data;

  let email: string | null;
  if (identifier.includes("@")) {
    email = identifier;
  } else {
    try {
      email = await resolveUsernameToEmail(identifier);
    } catch {
      console.error(
        "SUPABASE_SECRET_KEY missing or invalid: login by username is unavailable. " +
          "Paste it into .env.local, or sign in with the demo email.",
      );
      email = null;
    }
  }

  const supabase = await getServerClient();

  if (!email) {
    // Dummy sign-in against a non-existent address, so the "username not
    // found" path takes comparable time to a real failed attempt
    // (Requirement 1.6 — never reveal whether the account exists).
    await supabase.auth.signInWithPassword({ email: "no-such-account@rjm.local", password });
    recordFailure();
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    recordFailure();
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  // 3a. Re-check deactivation after authentication: an identifier containing
  // "@" skips the username lookup's own `deactivated_at` filter entirely.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("deactivated_at")
      .eq("id", data.user.id)
      .maybeSingle();
    if ((profile as { deactivated_at: string | null } | null)?.deactivated_at) {
      await supabase.auth.signOut();
      recordFailure();
      return { ok: false, code: "INVALID_CREDENTIALS" };
    }
  } catch {
    // `profiles` does not exist yet (pre-Phase-2) or the query failed for
    // another reason — fail safe rather than trust an unverifiable session.
    await supabase.auth.signOut();
    recordFailure();
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  // Success: clear the throttle, persist the "remember me" choice, and let
  // the proxy's and this request's cookie writers agree on cookie lifetime
  // through `authCookieOptions` from here on. The preference cookie itself
  // is written with its own 400-day `maxAge` directly — `authCookieOptions`
  // governs the *auth session* cookies' lifetime, not this one, and its
  // `remember=true` branch hardcodes a 30-day `maxAge` that would otherwise
  // silently clobber the 400-day value passed in here.
  store.delete(THROTTLE_COOKIE);
  store.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 400,
  });

  redirect("/dashboard");
}
