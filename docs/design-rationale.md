# Design rationale

This file is a living document, appended to at the end of each phase
(Requirement 25.2, 25.8). It records every place the build deviates from
the low-fidelity wireframe or from a literal reading of the brief, plus
the reasoning for it, in plain language a student can defend in a viva.
It will also grow a short "future work" section once later phases reach
the features that are deliberately deferred (`job_tasks`, suppliers,
payments, dark mode, a real vector logo).

## Phase 1 — Scaffold, tokens, layout shell, i18n, auth

**Logo handling (design §5.7).** `public/rjm-logo.jpg` is a raster JPG with
a black background and yellow "RJM FURNITURE" lettering — colours that
belong to neither the Dusk/Navy/Orange palette nor the accessible status
set. A JPG also has no transparent background, so placing it directly on a
white card would show a hard black rectangle that reads as a layout
mistake rather than a brand choice. `BrandLogo` instead places the image
inside a Midnight Navy rounded tile (`rounded-lg p-2`) at a fixed render
size (40 × 40 px in the sidebar and top bar, 64 × 64 px on the login card)
with `alt="RJM Furniture logo"`, so the black edge reads as intentional and
nothing shifts layout while the image loads. The same tile keeps the logo
legible in high-contrast mode, where the surrounding chrome turns pure
white. **Recommendation for after the deadline:** export an SVG or
transparent PNG of the wordmark and swap the file — only `BrandLogo`
touches the asset, so nothing else in the app changes. No alternative logo
was invented.

**Sidebar additions beyond Requirement 6.1's seven-item wireframe list
(design §20, "Sidebar navigation").** Two items were added to the sidebar
that the wireframe does not draw:

- **Customers**, as an indented sub-item of Job Orders rather than a new
  top-level entry. The data model needs a `customers` table because every
  job order references one, and those records need somewhere to live;
  nesting it under Job Orders keeps the wireframe's seven top-level items
  in their settled order instead of renumbering the list.
- **Feedback**, as item 9 after Users. The brief asks for a Feedback /
  Observations review page beyond the ten wireframe screens, and burying
  that page under Settings would make an indicator-22 deliverable hard for
  the professor to find during grading.

Users at position 8 is Requirement 6.3's own screen, not a deviation.

## Phase 2 — Migrations, RLS, seed data, generated types, Settings

**The money-tables schema amendment (design §7.1, §8) — approved and
built as designed.** `quoted_price`, `unit_cost` and `unit_cost_at_time`
live in their own one-to-one tables (`job_pricing`, `material_costs`,
`inventory_transaction_costs`) rather than as columns on `jobs`,
`materials` and `inventory_transactions`. The reasoning is unchanged from
the design document: Supabase gives every signed-in user the same
Postgres role, so a column a carpenter must never see cannot be hidden by
a column privilege — it has to live in a row that an RLS policy can
refuse outright. The twelve migrations in `supabase/migrations/` and the
grants matrix spot-checks in this phase (jobs, materials, job_pricing —
one allowed, one forbidden, one `anon`-key read, for each) confirm the
structural claim holds: a worker's client never receives a row with a
price or a cost in it, because the table that would carry it returns
zero rows to that role.

**Two implementation bugs the design's SQL sketches did not anticipate,
found and fixed during this phase, recorded here because a reviewer
should know the design document's sketches were not literally
copy-pasted.**

- `record_stock_movement()`'s `RETURNS TABLE` declares an output column
  named `unit`, and the function's own row-lock query
  (`select id, name, unit, current_stock into v_material from materials
  …`) also reads a column named `unit` — PL/pgSQL treats both as
  variables in scope, so the unqualified reference was ambiguous and
  Postgres refused every call with `column reference "unit" is
  ambiguous`. Fixed by aliasing the table (`from public.materials m`) and
  qualifying every column read in that statement. Caught by the task 2.13
  spot check itself (a worker's real `stock_out` call failed), not by
  code review — which is the reason that check exists.
- The grants matrix (design §10) granted `authenticated` a `select` on
  six `profiles` columns and left `preferences` out, reasoning that
  reached only as far as "nobody should read a secret column." But
  `preferences` is not a secret — it is the value Requirement 15.8
  promises will follow a user to a new device, and a column that cannot
  be selected cannot be read back on that new device at all. The grant
  was widened to include `preferences`; the `profiles_select_all` policy
  already covers every row and column equally, so the fix is purely a
  grant, not a policy change, and still structurally cannot expose
  `email` (left out on purpose, §7.1).

**`supabase db push --include-seed` does not reseed an already-migrated
project.** The design's seeding order (§21.4) assumed `--include-seed`
re-runs the seed file on every invocation. In the CLI version this
project uses, that flag only takes effect while migrations are *also*
being applied — once all twelve are up to date, the command reports
"Remote database is up to date" and skips the seed step silently.
`scripts/seed-reset.ts` therefore calls `supabase db query --remote
--file supabase/seed/010_business_data.sql` directly, which runs the SQL
file unconditionally regardless of migration state. This is the one
place this phase's implementation departs from the design document's
literal command sequence; the effect (business data re-centred on the
current month before grading) is unchanged.

**Seed naming and figures (design §21.3), as actually seeded.** The
business-data seed keeps the wireframe's five named customers (Maria
Santos, Jose Reyes, Ana Villanueva, Paolo Garcia, Liza Flores) and the
eight named materials (Mahogany Lumber, 3/4" Marine Plywood, 2" Common
Nails, 1.5" Wood Screws, 120-Grit Sandpaper, Wood Glue, Cabinet Hinges,
Clear Varnish) at their wireframe stock figures, fills out the remaining
15 customers and 56 materials with plausible fictional workshop names
across the seven categories, and reproduces the third wireframe defect's
fix exactly as designed: 42 job orders split 29 completed / 7 pending /
5 in-progress / 1 on-hold (not the wireframe's 29/8/5 with no On Hold
segment), so the Dashboard's Job Status Overview renders four computed
bars that add up to 42, not three that quietly drop a real row. The
109-row ledger (64 backdated opening counts + 45 in-month movements)
reproduces the wireframe's five named transactions with their original
material, quantity and reason, re-pointed at the seeded job codes and
re-dated relative to `current_date` so the figure is never stale on the
day of grading. All of this is generated and arithmetic-checked (every
material's `sum(delta) = current_stock`) before being written out as a
plain, readable SQL file — the generator itself is a throwaway build-time
tool, not a repository artefact, so `supabase/seed/010_business_data.sql`
stays the one thing a reader has to open to see what was seeded.

**Demo account passwords are not committed anywhere.** `scripts/seed.ts`
reads each of the three demo passwords from its own environment variable
(`SEED_OWNER_PASSWORD`, `SEED_ADMIN_PASSWORD`, `SEED_WORKER_PASSWORD`),
set locally in the gitignored `.env.local`, rather than hardcoding them
in the script. `.env.example` documents the three variable names with no
values. This is a tighter rule than the design document's own password
table in `design.md` §21.2, which does print the three demo passwords in
prose — that table predates this phase and was left untouched (Phase 2's
scope is migrations, seed scripts and Settings, not rewriting Phase 1/0's
design document), but no file this phase adds repeats them.

## Phase 3 — Job Orders and customers

**A real bug in `update_job_order()` found by exercising the screen, not
by reading the SQL.** Migration `0009_job_material_rpcs.sql`'s
`update_job_order()` declares `returns table (job_id uuid, job_code text,
old_status text, new_status text)`, and PL/pgSQL treats those four names
as variables in scope for the whole function body — the same class of bug
Phase 2 already found once in `record_stock_movement()`'s `unit` column
(see that phase's section above). Two statements in `update_job_order()`
read or wrote `jobs`/`job_pricing` columns with the same bare names as
those output variables: `select job_code, status into v_old from
public.jobs where id = p_job_id …` and `delete from public.job_pricing
where job_id = p_job_id`. Both raised `column reference "…" is ambiguous`
(Postgres error `42702`) on every real edit, which the server action
mapped to the generic `UNEXPECTED` code — so the symptom on screen was
simply "Save does nothing, no toast, dialog stays open," with no field
error and no visible exception. This was found by the Phase 3 smoke test
actually editing a job order end to end against the live dev project, not
by a second reading of the migration file; a static review of the SQL
reads correctly at a glance, which is exactly why this bug class keeps
recurring and why it is recorded here a second time. Fixed by qualifying
both references to a table alias (`select j.job_code, j.status into v_old
from public.jobs j where j.id = p_job_id …` and `delete from
public.job_pricing jp where jp.job_id = p_job_id`), committed as an
amendment to migration `0009_job_material_rpcs.sql` itself (the file is a
`create or replace function`, so re-applying it is idempotent) and
pushed to the live dev project. `create_job_order()` and
`update_job_status()` were checked against the same pattern and do not
have it: neither reads an unqualified column whose name collides with
one of its own output parameters.

**The job order form is always a `StepForm`, never conditionally so.**
Requirement 9.7 asks for steps "when the form has more than six fields,
or Simple mode is on." The staff create/edit form has eight (customer,
project name, description, order date, expected completion, assigned
worker, status, quoted price), which is unconditionally over six, so
`JobForm` has no branch that ever renders a flat form — the condition in
the requirement is satisfied by the field count alone for every session.
`StepForm` (design §6.2) was built in Phase 1 but had no caller until this
phase; it needed one small, backward-compatible addition here — an
optional controlled `step`/`onStepChange` pair, defaulting to the
component's own internal state when omitted — so that a failed
submission can jump the wizard to the step holding the first invalid
field before calling `setFocus` (Requirement 9.5's "move focus to the
first field in error" cannot land on a field whose step is not the one
currently showing). No existing caller of `StepForm` was broken by this,
because there were none yet.

**The worker's status-only form is one component, used in two places.**
`JobStatusForm` renders the plain-words restriction statement
(Requirement 9.8) and the single status control; it is opened both from
the Job Orders list's Edit action and from the job detail page's "Update
status" button, so a worker sees the identical control and the identical
restriction copy regardless of which screen they started from, and a
future change to that copy only has one place to happen. The disabled
reason shown inside it (`JOB_NOT_ASSIGNED` or `JOB_COMPLETED`, from the
`Errors` message namespace) satisfies the task's "disabled with a visible
explanation" requirement in the same place for both entry points.

**Soft delete and Undo go through the plain `jobs_update_staff` grant,
not a function**, exactly as design §13.5 specifies — `softDeleteJob` and
`restoreJob` in `src/actions/jobs.ts` are a symmetrical `set deleted_at =
now()` / `set deleted_at = null` through PostgREST, which is what keeps
Undo a trivial inverse of the delete rather than a second code path.

**Error handling for this phase's RPCs is deliberately smaller than
design §18.2's full table.** `src/lib/errors.ts` was created in this
phase with the `ActionResult<T>` shape and the subset of error codes
`create_job_order`, `update_job_order` and `update_job_status` can
actually raise (`NOT_PERMITTED`, `CUSTOMER_NOT_FOUND`,
`ASSIGNEE_NOT_FOUND`, `INVALID_STATUS`, `JOB_NOT_FOUND`,
`JOB_NOT_ASSIGNED`, `JOB_COMPLETED`, `CODE_GENERATION_FAILED`, plus the
generic `NETWORK`/`UNEXPECTED`/`VALIDATION`). Task 4.5 is where the full
design §12.5 stock-RPC error map gets added to this same file — nothing
built here needs to change for that, only grow, because the file's shape
(one `ErrorCode` union, one `mapSupabaseError()` function, one
`errorCodeToKey()` helper turning `NOT_PERMITTED` into the `Errors`
namespace's `notPermitted` key) is the same shape design §18.2 describes
for the whole table.

**The job detail page shows exactly what Requirement 9.12 asks for, no
more.** Status history renders `from → to` transitions with a timestamp,
not who made the change — the schema design's own §13.4 note says "where
available," and a `changed_by` → profile name join was judged not worth
the extra query for a line that is never more than one or two rows deep
on a four-day clock (brief ADDENDUM 2's "prefer the simplest design").
Materials issued to the job reuse `v_transactions_list` filtered to
`type = 'stock_out'`, which already carries no cost column, so the panel
needed no new query shape and no new leak surface to reason about.

## Phase 4 — Inventory, Inventory Transactions, stock rules

**A second occurrence of the same ambiguous-column bug class, this time
in `upsert_material()`, found by the Phase 4 smoke test and fixed in a
new migration rather than by editing an already-applied file.**
`upsert_material()`'s `RETURNS TABLE` declares `material_code` and
`current_stock` as output parameters (design §13.3), and its final
statement read both names unqualified — `select material_code,
current_stock into v_code, v_stock from public.materials where id =
v_id` — which is exactly the pattern Phase 2 found once in
`record_stock_movement()`'s `unit` column and Phase 3 found again in
`update_job_order()`'s `job_code`/`status`. Every real call to
`upsert_material()` failed with `column reference "material_code" is
ambiguous`, which would have blocked both the Add Inventory Item form and
every opening-stock figure — a complete block on Requirement 10.6/13.3,
not a cosmetic bug. Unlike Phase 3's fix (an amendment to the
still-malleable migration that introduced the bug), migration `0009` had
already been applied to the live dev project by the time this phase
started, so editing that file in place would not change what Postgres is
actually running. The fix is instead `supabase/migrations/
0013_fix_upsert_material_ambiguous_column.sql`: a `create or replace
function` that reproduces `upsert_material()` exactly, with the one
colliding statement qualified (`select m.material_code, m.current_stock
into v_code, v_stock from public.materials m where m.id = v_id`), pushed
with `supabase db push --remote`. The lesson recorded a third time: a
function whose `RETURNS TABLE` names collide with a column name it reads
needs every such reference qualified, and that is now worth a
pre-migration-review checklist item rather than something each phase
discovers independently.

**A stale `transaction_code_seq` sequence, found live and resynced by
SQL rather than by a code change.** `TXN-NNNN` codes come from a plain
Postgres sequence (`transaction_code_seq`, design §11.3), not the
heal-then-retry counter `next_job_code()` uses — sequences are assumed
never to collide because nothing but `record_stock_movement()` writes
`inventory_transactions`. The live dev project's ledger held 110 rows,
one more than the 109 the seed file documents, left over from an earlier
phase's own real RPC call against the dev project (most likely a §2.13
grants spot-check, which calls `record_stock_movement()` for real) that
was never followed by a re-sync of the sequence. The seed's one-time
catch-up (`setval('transaction_code_seq', 1094)`, written at authoring
time) did not know about that extra row, so the sequence sat one step
behind reality and the very first live stock-in this phase attempted
collided with the pre-existing `TXN-1095`. Fixed by resyncing the
sequence to the table's real maximum
(`setval('transaction_code_seq', (select max(...)), true)`) — a one-time
operational statement against the live project, not a schema or function
change, so no migration file carries it. Recorded here, rather than left
silent, because the next person to run a real RPC call against this
project should know the sequence can drift behind manual testing and
that resyncing it is the correct response, not evidence of a logic bug
in `record_stock_movement()` itself (which, once the drift was cleared,
produced the exact arithmetic — 10 in, 3 out, 7 left — the smoke test
expected).

**The Stock In form folds Requirement 11.9's correction path into
itself, instead of adding a third button.** The wireframe (screen 6) and
Requirement 11.3 fix exactly two buttons, "+ Record Stock In" and
"Record Stock Out" — there is no "Record Adjustment" button anywhere in
the brief. But Requirement 11.9 still requires a correction path for a
wrongly-recorded transaction, and `record_stock_movement()`'s `adjustment`
type (design §12.2) is that path. Rather than inventing a third button
the wireframe does not draw, `StockMovementForm`'s stock-in mode carries
a small "Transaction Type" choice (Stock In / Adjustment); choosing
Adjustment reveals a direction field (raise/lower) in place of the
implicit "always adds" behaviour of a plain delivery. The `/transactions`
screen's info banner gained a second line explaining this — "a
transaction cannot be edited or deleted; record a new Adjustment from
'+ Record Stock In' instead" — which is the "where a user would look for
Edit" placement Requirement 11.9 asks for, since the ledger's fixed seven
columns (Requirement 11.5) leave no Actions column for an Edit button to
have lived in in the first place.

**The stock-out job-order picker excludes completed jobs for every role,
not only the worker the RPC itself restricts.** `record_stock_movement()`
only refuses a completed job's `stock_out` for a `worker` caller (design
§12.2 step 6) — staff could, by the function's own rule, record a
stock-out against a job already marked complete. The picker in
`queries/transactions.ts` filters out completed jobs uniformly instead,
because issuing material to a finished job has no legitimate shop
reason regardless of who is doing it, and a staff member should not have
to discover that the hard way after choosing it. This is a UI-level
narrowing of an already-permissive RPC, not a duplicate of its
authorisation logic (Requirement 20.10's "block at the point of entry"
read in the spirit the brief's ADDENDUM 2 asks for — basic UX, not a
second implementation of the server's rule).

**The Inventory list keeps its eighth column (Actions) for a worker,
empty rather than removed.** Requirement 10.5 fixes eight columns "in
order" for the table with no stated worker exception the way it carves
one out for the Unit Cost column in Requirement 10.9. Rather than
dropping the Actions column to seven for a worker (which would also
shift every other screen's column count expectations out of sync with
the requirement's literal text), `InventoryPageClient` renders the column
header for every role and simply has no buttons to put in it for a
worker — consistent with Requirement 10.9's "no Add, Edit or Delete"
reading as "no actions", not "no Actions column".

## Phase 5 onward

_Appended as each later phase closes out (tasks 5.8, 6.10, 6.17)._
