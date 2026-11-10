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

## Phase 3 onward

_Appended as each later phase closes out (tasks 3.6, 4.6, 5.8, 6.10,
6.17)._
