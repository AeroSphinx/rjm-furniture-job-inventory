import { z } from "zod";

/**
 * Requirement 1.3: both fields required; sizes per design §14.2. Lives in
 * its own module (design §3.3's "one file per entity in `src/schemas/`")
 * because `src/actions/auth.ts` has a module-level `"use server"` directive
 * once `signIn` is a proper Server Action, and such a file may only export
 * async functions — a `z.object()` value and its inferred type have to live
 * somewhere else. The client imports this for `zodResolver`; the server
 * action imports the same object and calls `safeParse`.
 */
export const LoginSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(72),
  remember: z.boolean(),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;
