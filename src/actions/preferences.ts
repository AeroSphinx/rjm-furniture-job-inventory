"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { LOCALE_COOKIE, PREFS_COOKIE, PREFS_COOKIE_MAX_AGE } from "@/lib/supabase/cookie-options";
import { PreferencesSchema, type Preferences } from "@/schemas/preferences";

export type SavePreferencesResult = { ok: true } | { ok: false; code: "INVALID_INPUT" | "SAVE_FAILED" };

/**
 * `savePreferences` server action (design §15.3): parse with
 * `PreferencesSchema`, write `profiles.preferences` (allowed by the
 * `profiles_update_self` policy), mirror the two cookies, and revalidate
 * every route so the new `<html>` attributes render on the next request.
 * The form applies the change optimistically on the client, so a failure
 * here must not silently revert it — the caller keeps the user's chosen
 * values on screen and shows an error toast with a "Try again" action
 * (Requirement 15.15).
 */
export async function savePreferences(values: Preferences): Promise<SavePreferencesResult> {
  const parsed = PreferencesSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_INPUT" };
  }

  const profile = await requireUser();
  const supabase = await getServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: parsed.data })
    .eq("id", profile.id);
  if (error) {
    return { ok: false, code: "SAVE_FAILED" };
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, parsed.data.language, {
    path: "/",
    sameSite: "lax",
    maxAge: PREFS_COOKIE_MAX_AGE,
  });
  store.set(PREFS_COOKIE, JSON.stringify(parsed.data), {
    path: "/",
    sameSite: "lax",
    maxAge: PREFS_COOKIE_MAX_AGE,
  });

  revalidatePath("/", "layout");

  return { ok: true };
}
