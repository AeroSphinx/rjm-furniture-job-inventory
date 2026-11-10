import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env";

/**
 * Next 16's renamed middleware (design §3.4, §14.1). Runs on every request
 * the matcher lets through, refreshes the Supabase session with
 * `getClaims()`, and copies the refreshed cookies onto the response.
 *
 * A proxy sees pathnames, not route groups, so "redirect `(app)` routes"
 * is not a rule it can implement — it needs an explicit public allowlist,
 * or the first redirect loops on `/login` itself. `PUBLIC_PATHS` holds one
 * entry on purpose: this app has no OAuth callback, no magic link and no
 * password-reset email (settled decision D4), so there is nothing else to
 * allow. `/` is deliberately not in it: `src/app/page.tsx` handles that
 * address itself (design §3.1).
 */
const PUBLIC_PATHS = ["/login"];

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|rjm-logo.jpg).*)"],
};

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Never trust getSession() on the server — getClaims() verifies the token.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
