import { redirect } from "next/navigation";

import { isSignedIn } from "@/lib/auth";

/**
 * Route groups contribute nothing to the URL, so without this file nothing
 * matches `/` and a visitor to the bare deployed address would hit
 * `not-found.tsx` — breaking Requirement 1.1 (design §3.1). This page does
 * one thing: send a signed-in visitor to the Dashboard and everyone else
 * to the Login screen.
 */
export default async function RootPage() {
  redirect((await isSignedIn()) ? "/dashboard" : "/login");
}
