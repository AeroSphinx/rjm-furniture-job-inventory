import { z } from "zod";

/**
 * Two-tier env validation (design §2).
 *
 * `.env.local` ships with `SUPABASE_SECRET_KEY=` left blank for the student to
 * paste in (Requirement 26.2), so a single schema validated at module load
 * would throw on `npm run dev` before the first page ever rendered. The four
 * public variables are validated eagerly, right here, because nothing in the
 * app works without them (Requirement 26.4). The secret key is validated
 * lazily, only by the three server-only call sites that actually need it.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).catch("false"),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
});

/**
 * Validated lazily, server only. Called from exactly three places:
 * `src/lib/supabase/admin.ts`, `src/app/api/admin/users/route.ts` and
 * `scripts/seed.ts`. Every page and every list runs on `publicEnv` alone, so
 * the app boots and every screen renders with the secret key still blank —
 * only the Users page, the seed script and login-by-username need it.
 */
export function requireSecretKey(): string {
  const value = process.env.SUPABASE_SECRET_KEY;
  if (!value) {
    throw new Error(
      "Paste SUPABASE_SECRET_KEY into .env.local — the Users page, the seed script " +
        "and login by username need it. Until then, sign in with the demo email.",
    );
  }
  return value;
}
