import { cache } from "react";
import { redirect } from "next/navigation";

import { getServerClient } from "@/lib/supabase/server";
import type { Role } from "@/components/layout/Sidebar";

/**
 * The cheap claims-only check `src/app/page.tsx` uses to decide between
 * `/dashboard` and `/login` (design §3.1). No profile load — that is
 * `requireUser()`'s job.
 */
export async function isSignedIn(): Promise<boolean> {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims);
}

export type AuthenticatedProfile = {
  id: string;
  fullName: string;
  role: Role;
};

type ProfileRow = { id: string; full_name: string; role: Role; deactivated_at: string | null };

/**
 * One profile load per request (design §14.3). Wrapped in React `cache()`
 * so `requireUser()` can be called from a layout and again from a page
 * without a second round trip. Returns `null` on anything that stops the
 * row being trustworthy — no row, or the `profiles` table not existing yet
 * before Phase 2's migrations run — so the caller always fails closed
 * instead of assuming a schema that is not there.
 */
const loadProfile = cache(async (userId: string): Promise<ProfileRow | null> => {
  const supabase = await getServerClient();
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, deactivated_at")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProfileRow;
  } catch {
    return null;
  }
});

/**
 * Fail-closed session **and** profile gate (design §14.3, Requirement 3.9).
 * A session without a profile row — a hand-made auth user, or one whose
 * `profiles` row was deleted by hand, or an account the Owner has
 * deactivated — reaches no `(app)` route. Signing out *before* redirecting
 * is what prevents a loop: if the cookies stayed, the proxy would see an
 * authenticated request for `/login`, bounce it to `/dashboard`, and this
 * function would send it straight back.
 */
export async function requireUser(): Promise<AuthenticatedProfile> {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getClaims(); // never getSession() on the server
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const profile = await loadProfile(claims.sub);
  if (!profile || profile.deactivated_at) {
    await supabase.auth.signOut();
    redirect(profile ? "/login?reason=deactivated" : "/login");
  }

  return { id: profile.id, fullName: profile.full_name, role: profile.role };
}

/**
 * `requireUser()` plus a role check (design §14.3). The sidebar hides
 * Reports and Users from roles that cannot use them from the same
 * `profile.role` value, so navigation and authorisation cannot disagree —
 * this is the second layer behind RLS, never the only one (Requirement
 * 3.10).
 */
export async function requireRole(roles: Role[]): Promise<AuthenticatedProfile> {
  const profile = await requireUser();
  if (!roles.includes(profile.role)) redirect("/no-access");
  return profile;
}
