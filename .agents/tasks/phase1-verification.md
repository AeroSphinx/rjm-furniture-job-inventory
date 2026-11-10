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

## Guardrails confirmed

- No Supabase migration or seed command was run.
- No schema beyond what already existed was assumed; `requireUser()` and
  the `signIn` action both fail closed (return to `/login` or the generic
  error) if the `profiles` table does not exist yet.
- No file in the repo contains the live secret key value.
- No dev server, log file or temp file was left behind.
