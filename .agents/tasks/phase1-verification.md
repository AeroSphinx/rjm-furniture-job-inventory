# Phase 1 verification — tasks 1.9–1.12 (resumed run)

This note records the checks run while finishing Phase 1 after the prior
run crashed mid-way through tasks 1.9/1.10, with 1.1–1.8 already committed.

## 1. Known bug fix (LoginForm / LoginSchema)

`remember: z.boolean().default(false)` made the schema's input type
`boolean | undefined` while its output type (and `useForm<LoginFormValues>`,
`LoginFormValues = z.infer<typeof LoginSchema>`) was `boolean` — a
`zodResolver`/`useForm` generic mismatch (TS2322/TS2345 at the lines the
resolver and `handleSubmit` were used).

Fix: `remember: z.boolean()` (no `.optional()`, no `.default()`); the
`false` default is supplied once, in `LoginForm`'s `useForm({ defaultValues
: { remember: false, ... } })`. No casts were added.

While fixing this, `LoginSchema`/`LoginFormValues` were moved out of
`src/actions/auth.ts` into a new `src/schemas/auth.ts`, because turning
`signIn` into a real Server Action requires a module-level `"use server"`
directive, and a file with that directive may only export async functions
— a `z.object()` value can't live there any more. This follows design
§3.3's "one file per entity in `src/schemas/`" convention.

```
npx tsc --noEmit
```
Before the fix: 2 errors in `LoginForm.tsx` (lines 41 and 66). After the
fix: **0 errors.**

## 2. `npm run build`

```
npm run build
```
Result: **succeeded**, zero TypeScript errors.

```
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /login
└ ƒ /no-access
ƒ Proxy (Middleware)
```

(First attempt failed with "It is not allowed to define inline 'use
server' annotated Server Actions in Client Components" because the
original `"use server"` directive sat inside the `signIn` function body
rather than at the top of the module — moving it to the top of
`src/actions/auth.ts` and extracting the schema as above fixed this.)

## 3. `npm run dev` — Ready check

Started detached (`cmd.exe /c npm run dev`, output redirected to a log
file) rather than through an interactive shell, waited 8 seconds, then
read the log:

```
▲ Next.js 16.4.6 (Turbopack)
- Local:         http://localhost:3000
✓ Ready in 1484ms
```

The process (and the `node.exe` child it spawned) was then stopped with
`Stop-Process -Force`. Confirmed afterwards: no process listening on port
3000, no `node.exe` process running. The temporary `dev-out.log`,
`dev-err.log` and `dev-pid.txt` files used to capture this were deleted;
none were committed.

## 4. `tasks.md` checkbox state, 1.1–1.12

All twelve Phase 1 checkboxes are now `[x]`:

```
1.1  [x]  1.2  [x]  1.3  [x]  1.4  [x]  1.5  [x]  1.6  [x]
1.7  [x]  1.8  [x]  1.9  [x]  1.10 [x]  1.11 [x]  1.12 [x]
```
1.1–1.8 were already `[x]`-eligible from the prior run's six commits; this
run marked 1.9–1.12 after verifying each against design.md and
requirements.md. No Phase 2 checkbox was touched.

## 5. Secret-key grep

```
git grep -n "sb_secret_zm"        -- .     → no matches (exit 1)
git grep -n "sb_secret_"          -- .     → only the grep-pattern name itself,
                                               in .agents/tasks/design-review.md
                                               and .kiro/specs/.../design.md
                                               (documenting the check, not a key)
```
`.env.local` (gitignored, confirmed with `git check-ignore -v .env.local`
and `git ls-files .env.local` returning nothing) still has
`SUPABASE_SECRET_KEY=` blank.

## 6. `git log` and `git status`

```
9cfd2c9 feat: fail-closed requireUser/requireRole and the no-access screen (task 1.11)
ebb6491 feat: signIn server action, authCookieOptions, remember-me cookie lifetime (task 1.10)
19f522c fix: resolve LoginSchema/zodResolver generic mismatch; build Login screen (task 1.9)
e2255af feat: Supabase clients and the auth proxy (task 1.8)
7e5be59 feat: next-intl cookie-based locale setup, en-PH date/money formatting (task 1.7)
59d61e2 feat: BrandLogo, app shell and reusable pattern components (task 1.6)
b04112f feat: generate shadcn/ui primitives with pinned a11y defaults (task 1.5)
048917e feat: env validation, design tokens, contrast checker (tasks 1.2-1.4)
c11a684 chore: scaffold Next.js app with mandated stack (task 1.1)
```

A fourth commit (docs + `tasks.md` + this file) follows this note.

`git status` immediately before that final commit: only `docs/
design-rationale.md`, `docs/evaluation-traceability.md`,
`.kiro/specs/rjm-furniture-system/tasks.md` and this file left
uncommitted; working tree otherwise clean.

## 7. Files touched, grouped by task

- **Bug fix + task 1.9** — `src/schemas/auth.ts` (new), `src/components/
  features/auth/LoginForm.tsx`, `src/components/features/auth/
  ForgotPasswordDialog.tsx`, `src/app/(public)/login/page.tsx`.
- **Task 1.10** — `src/actions/auth.ts`, `src/lib/supabase/
  cookie-options.ts`, `src/proxy.ts` (import of `authCookieOptions`/
  `REMEMBER_COOKIE`).
- **Task 1.11** — `src/lib/auth.ts` (`requireUser`, `requireRole` added
  next to the existing `isSignedIn`), `src/app/(app)/no-access/page.tsx`
  (new), `messages/en.json` + `messages/fil.json` (`NoAccess` namespace).
- **Task 1.12** — `docs/design-rationale.md` (new), `docs/
  evaluation-traceability.md` (new), `.kiro/specs/rjm-furniture-system/
  tasks.md` (checkboxes 1.1–1.12).

## Round 2 — review findings fixed

`.agents/tasks/phase1-verdict.json` (`CHANGES_REQUESTED`) and
`.agents/tasks/phase1-review.md` reported five findings against the
tasks 1.9–1.12 diff above. All five were fixed; none required a product
decision or a user-visible behavior change beyond what design.md already
specified, so no `send_message` warning was needed.

1. **Password toggle below the 44×44 px floor** — `LoginForm.tsx`'s
   show/hide button was `size-9` (36×36 px). Changed to `size-11`
   (44×44 px), matching the `Dialog` close button and `Button` icon size
   already used elsewhere.
2. **Username lookup used `ILIKE` instead of an exact match** —
   `resolveUsernameToEmail` in `src/actions/auth.ts` called
   `.ilike("username", username)`; a username containing `_` (a SQL
   single-character wildcard, valid per design §14.4's character class)
   could match the wrong row. Changed to
   `.eq("username", username.toLowerCase())`, matching design §14.2's
   `lower(username) = lower($1)`.
3. **`rjm_remember` cookie truncated from 400 days to 30** —
   `authCookieOptions(true, { maxAge: 60 * 60 * 24 * 400 })`'s 400-day
   value was discarded by the helper's own hardcoded 30-day `maxAge` in
   its `remember=true` branch. The preference cookie is now written with
   its own explicit `{ path: "/", sameSite: "lax", maxAge: 60*60*24*400 }`
   directly, bypassing `authCookieOptions` (which still governs only the
   real auth-session cookies, unchanged).
4. **`src/lib/supabase/server.ts` not wired through `authCookieOptions`**
   — only `src/proxy.ts` mapped its cookie `setAll` through the helper.
   `server.ts` now reads `REMEMBER_COOKIE` the same way the proxy does and
   maps every `setAll` cookie through `authCookieOptions(remember,
   options)`, per design §14.2.
5. **`reason=deactivated` had no reader** — `requireUser()` already
   redirected deactivated accounts to `/login?reason=deactivated`, but
   the login page never read it, so design §14.3's "slight emphasis" on
   the "Need help? Contact the system administrator." helper text never
   rendered. `src/app/(public)/login/page.tsx` now awaits `searchParams`
   and passes `deactivated={reason === "deactivated"}` to `LoginForm`,
   which swaps the helper text's class to bold/foreground instead of
   muted — same copy, same generic-error principle, no account-state
   disclosure beyond what design.md already specified.

### Re-verification after the fixes

```
npx tsc --noEmit        → clean, 0 errors
npm run build            → succeeded, zero TypeScript errors
                            Route (app): /, /_not-found, /login, /no-access
```

`npm run dev` was started detached a second time (`cmd.exe /c npm run
dev`, output redirected to `.agents/tasks/dev-out.log`/`dev-err.log`),
confirmed `✓ Ready in 1607ms` in the log, then every `node.exe` process
was stopped (`Stop-Process -Force`); `Get-Process node` afterward returned
nothing. Both log files were deleted and are not present in the repo.

Secret-key grep repeated: `grep_search` for `sb_secret_` across the
workspace returns only the pattern name itself inside `design.md` and
`design-review.md` (documenting the `check-secrets.ts` convention), never
a live key. `.env.local`'s `SUPABASE_SECRET_KEY=` line is still blank.

`git log --oneline -6` after the fixes:

```
247b0e1 fix: render the admin-contact helper text with emphasis on a deactivated-account redirect (review finding)
c836336 fix: stop truncating the rjm_remember 400-day cookie and wire server client cookies through authCookieOptions (review findings)
0ab22f0 fix: resolve username lookup with an exact match instead of ILIKE (review finding)
66bd085 fix: enlarge password toggle to the 44x44 px touch-target floor (review finding)
0f9c188 docs: append Phase 1 design-rationale/evaluation-traceability entries, check off tasks 1.1-1.12 (task 1.12)
9cfd2c9 feat: fail-closed requireUser/requireRole and the no-access screen (task 1.11)
```

`git status` after the fourth fix commit: working tree clean except the
untracked `.agents/tasks/phase1-review.md` and
`.agents/tasks/phase1-verdict.json` (the review artifacts themselves,
left as found, not committed).

### Files touched, grouped by finding

- **Finding 1** — `src/components/features/auth/LoginForm.tsx` (toggle
  size only).
- **Finding 2** — `src/actions/auth.ts` (`resolveUsernameToEmail`).
- **Findings 3 & 4** — `src/actions/auth.ts` (remember-cookie write) and
  `src/lib/supabase/server.ts` (`setAll` now routed through
  `authCookieOptions`).
- **Finding 5** — `src/app/(public)/login/page.tsx` (reads
  `searchParams`) and `src/components/features/auth/LoginForm.tsx`
  (`deactivated` prop and emphasized helper text).

No Phase 2 work was started. No Supabase migration or seed command was
run.

## Guardrails confirmed

- No Supabase migration or seed command was run.
- No schema beyond what already existed was assumed; `requireUser()` and
  the `signIn` action both fail closed (return to `/login` or the generic
  error) if the `profiles` table does not exist yet.
- No file in the repo contains the live secret key value.
- No dev server, log file or temp file was left behind.
