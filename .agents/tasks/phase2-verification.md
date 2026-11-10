# Phase 2 verification note

Records what was run against the dev project (`rjm-dev`, ref
`twplmgailygbucbgjilc`) and the results, for the reviewer. No demo
password or the Supabase secret key appears anywhere below.

## 1. Migrations

All 12 migrations in `supabase/migrations/` applied to the dev project
with `npx supabase db push --remote --yes`, one at a time as written,
confirmed with `npx supabase migration list --remote`:

```
Local  | Remote | Time (UTC)
0001   | 0001   | 0001
0002   | 0002   | 0002
0003   | 0003   | 0003
0004   | 0004   | 0004
0005   | 0005   | 0005
0006   | 0006   | 0006
0007   | 0007   | 0007
0008   | 0008   | 0008
0009   | 0009   | 0009
0010   | 0010   | 0010
0011   | 0011   | 0011
0012   | 0012   | 0012
```

Two bugs were found while exercising the schema for real (not at `db
push` time — both are semantically valid SQL that only fails at runtime)
and fixed in place, using `supabase migration repair` to mark the
affected version `reverted` then re-applying the corrected file (for
`0008`, a `create or replace function`, the whole file replayed cleanly;
for `0002`, a `create table`, only the one corrected `grant` statement
was replayed via `supabase db query`, then the migration history entry
was repaired back to `applied` — `create table` is not idempotent, so the
full file cannot be safely replayed a second time):

1. `record_stock_movement()` (migration `0008`): `column reference "unit"
   is ambiguous` — the function's `RETURNS TABLE` declares an output
   column named `unit`, and the row-lock query also read an unqualified
   `materials.unit`. Fixed by aliasing the table and qualifying every
   column in that `select`.
2. `profiles` (migration `0002`): the `select` grant omitted
   `preferences`, which breaks Requirement 15.8 (preferences following a
   user to a new device, which needs to *read* the column, not only
   write it). Widened the grant to include `preferences`; `email` stays
   excluded.

Both fixes are committed in the migration files themselves (not as
separate patch files), and both were caught by the task 2.13 spot checks
below, run against the real dev project.

## 2. TypeScript and build

```
npx tsc --noEmit   → clean, no errors
npm run build      → next build --turbopack succeeded
                     Routes: /, /_not-found, /login, /no-access, /settings
                     (proxy/middleware present; no other (app) routes exist
                     yet — dashboard, jobs, inventory, etc. are later phases)
```

Run twice: once right after the Settings page was built, and again as
the last step before writing this note. Both clean.

## 3. RLS / grants spot checks (task 2.13)

Each check below was run for real against the dev project with the
publishable key — role-simulated by signing in as the seeded demo
account, and once with no session at all for the `anon`-key case. "FORBIDDEN"
for a `select` means either a thrown `permission denied` error (no grant
at all) or zero rows returned (a grant exists but no policy matches —
both are documented outcomes in design §9/§10, and both were seen below).

| Table / function | Allowed case (who, what, result) | Forbidden case (who, what, result) | `anon`-key case |
| --- | --- | --- | --- |
| `jobs` | worker `select * from jobs` → 42 rows | — (jobs is readable by everyone; see `job_pricing` for the forbidden case on the same job data) | `select id from jobs` → `permission denied for table jobs` |
| `materials` | worker `select * from materials` → 64 rows | worker `update materials set current_stock = 999 where material_code = 'MAT-002'` → `permission denied for table materials` | `select id from materials` → `permission denied for table materials` |
| `job_pricing` | owner `select job_id from job_pricing` → 36 rows | worker `select * from job_pricing` → 0 rows (grant exists, no matching policy) | `select job_id from job_pricing` → `permission denied for table job_pricing` |
| `profiles.email` | — | worker `select email from profiles` → `permission denied for column email` | — (covered by the `profiles` table-level check below) |
| `profiles.preferences` (after the fix) | worker `select preferences from profiles where id = own id` → the row's own preferences object | — | — |
| `record_stock_movement` (stock_out) | worker, own assigned job (`JO-2026-018`), material with stock → succeeds, returns new stock figure | worker, material at zero stock → `OUT_OF_STOCK`; worker, a job not assigned to them → `JOB_NOT_ASSIGNED`; worker attempting `stock_in` → `NOT_PERMITTED` | not attempted (no session to call an RPC with) |
| `usability_feedback` | any signed-in user, insert with `user_id = auth.uid()` → succeeds | any signed-in user, insert with someone else's `user_id` → policy violation | not attempted |

## 4. Seed confirmation

`npm run seed` (reads `SEED_OWNER_PASSWORD` / `SEED_ADMIN_PASSWORD` /
`SEED_WORKER_PASSWORD` from `.env.local` — never hardcoded in the
script) created/updated the three demo accounts. Confirmed by a real
query against `profiles` (not by exit code):

```
username | role         | full_name           | deactivated_at
admin    | admin_staff  | Aileen Cruz          | null
owner    | owner        | Mang Roger Mendoza   | null
worker   | worker       | Dario Ramos          | null
```

`supabase/seed/010_business_data.sql` applied; confirmed row counts:

```
customers                    20
materials                    64
material_costs                64
jobs                          42
job_pricing                   36
inventory_transactions       109 (+1 from a live spot-check stock-out — see below)
inventory_transaction_costs  110
```

Both seed assertions inside the file (the `sum(delta) = current_stock`
consistency check, and the date-centring check for jobs-this-month /
due-this-week / transactions-this-month) passed — the `db query` run
would have raised and aborted otherwise, and did not.

`dashboard_summary()` called live, returned (abridged):
`jobs_total: 42, jobs_completed: 29, jobs_pending: 7, jobs_in_progress: 5,
jobs_on_hold: 1, completion_rate: 69, low_stock_count: 3,
out_of_stock_count: 1, due_this_week: 2, txn_this_month: 45`. The
Low-Stock/Out-of-Stock materials are Mahogany Lumber, Wood Glue and Clear
Varnish (low) and 2" Common Nails (out) — four materials needing
attention, matching the wireframe's four-row table rather than its
three-item banner count (the deliberate fix recorded in
`docs/design-rationale.md`).

**One known, harmless drift from the spot checks above:** running the
`record_stock_movement` RLS spot check for real moved 1 sheet of `3/4"
Marine Plywood` (`MAT-002`) from the seeded demo data (12 → 11) and added
one extra ledger row outside the seed's own UUID ranges.
`scripts/seed-reset.ts` deletes and re-seeds by UUID range (matching the
design's own scope — it re-centres dates, it does not undo manual stock
movements against seeded materials), so this one unit of drift is still
present after a reset. It does not violate any invariant (the
consistency assertion still passes, because the RPC updated
`current_stock` and the ledger together) and is disclosed here rather
than silently left for a reviewer to discover.

## 5. Settings page smoke test (end to end)

Driven with a throwaway Playwright script against a production build
(`next build && next start --port 3100`), not the dev server, then
deleted:

1. `GET /login` → real Login screen.
2. Filled the identifier and password fields for the seeded **owner**
   account, submitted the real form (the `signIn` server action).
   Landed signed-in (no `(app)/dashboard` page exists yet — that is a
   later phase — so the browser reached whatever Next renders for that
   route today; `/settings` is the route this phase's smoke test cares
   about).
3. `GET /settings` → the real Settings page rendered "Language
   Preferences", "Text Size Preferences", "Display Preferences",
   "Accessibility Options" and "Simple Mode" — confirmed by text content,
   not just a 200 status.
4. Toggled the Simple mode switch, clicked "Save Preferences".
   `data-state` on the switch went `unchecked` → `checked`.
5. Reloaded the page: the switch was still `checked` — confirming the
   round trip through `savePreferences` persisted, not just client state.
6. Confirmed directly against the database (not the UI): the owner's
   `profiles.preferences.simple_mode` was `true`. Reset it back to the
   seeded default (`false`) immediately after.
7. Signed out through the real top-bar "Logout" control
   (`signOutAction`); landed back on `/login`.

The production server was stopped afterwards (`Stop-Process` on both the
`npx`/`next start` processes); confirmed no `node.exe` process remained
listening. All throwaway test scripts, logs and PID files were deleted.

## 6. Not completed in this phase

- `job_tasks` migration (2.12, `[STRETCH]`) was written as schema only,
  per its own task description — no UI reads it, as designed.
- The grants-matrix review (2.13) covered the tables and functions the
  spot checks above name; it did not re-verify every one of the ~15
  tables/views/functions individually with a live query (that full sweep
  is better scoped as part of task 6.14's `check-secrets`/`verify`
  tooling, which does not exist yet). The design's seven-box checklist
  was still applied in writing to every migration file.
