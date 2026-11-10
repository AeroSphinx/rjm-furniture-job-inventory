# Design review — `design.md` (fourth pass)

Reviewed: `.kiro/specs/rjm-furniture-system/design.md` (2,384 lines) against `.agents/tasks/brief.md` (including ADDENDUM and ADDENDUM 2) and `.kiro/specs/rjm-furniture-system/requirements.md`.
Date: 10 November 2026. Reviewer had no context from the authoring session; the document was judged on its own.

**Scope rule applied (ADDENDUM 2).** Findings below are limited to: does it satisfy a requirement, is it correct and buildable in four days, does it avoid a real security or data-loss bug. No finding here is raised on production-readiness grounds (no scaling, observability, infra, rate-limiting or extensibility findings). Nothing was escalated for being "not enterprise-grade".

**Checks actually run on this machine (not inferred):**

- all 26 package versions in §2 re-read from `registry.npmjs.org/<pkg>/latest` — every one matches;
- all 44 numerically distinct contrast pairings in §5.4 recomputed from the WCAG 2.1 relative-luminance formula — every one matches to 0.01;
- four vendor documentation pages fetched and string-matched: Supabase `db push` CLI reference, Supabase Next.js server-side auth guide, Supabase CLI config reference (`auth.enable_signup`), Supabase `gen types`, next-intl configuration, PostgREST v13 resource embedding;
- workspace grepped for `sb_secret_`, `service_role` and legacy key names.

No build, no install, no migration, no git, no database access (none is permitted in this step).

**Totals: 1 MEDIUM, 6 NIT. No HIGH.** The MEDIUM is a one-clause fix; the document is otherwise implementation-ready and I would expect the next pass to close it in a single edit.

---

## Findings

### 1. MEDIUM — the only writer of `job_status_history` has no stated security context, and on the direct-update path it has no privilege to write

**Where:** §13.4 (trigger table, `jobs_log_status_change`), §10 (`job_status_history` row: *"no insert grant … Rows are written only by the trigger on `jobs`, so the history cannot be faked or edited"*), grants matrix (`grant select on public.job_status_history to authenticated;`), §13.2 (*"the policy and the function are two doors into the same room"*).

**Problem.** Three facts in the document do not fit together:

1. `job_status_history` has RLS enabled (§9 checklist box 2 applies to every new table), a `select` policy only, and **no insert grant and no insert policy** for `authenticated`.
2. `jobs_log_status_change` is described as an `after update` trigger on `jobs`. Its security context is never stated, and the one trigger function whose body the document does show (`touch_updated_at`, §7.2) is a plain `language plpgsql` function. §7.2's own rule — *"every `security definer` function in this document carries `set search_path = public, pg_temp`"* — implies that a function not marked definer is invoker-rights.
3. The client keeps a live direct write path to `jobs.status`: `grant update (status, deleted_at, updated_at) on public.jobs to authenticated` plus `jobs_update_staff` (*"may change its status"*) and `jobs_update_assigned_worker`, which §13.2 explicitly calls the second of "two doors into the same room".

A non-`SECURITY DEFINER` trigger function executes with the privileges and RLS of the user who ran the triggering statement. So a status change arriving through door 2 (a plain PostgREST `PATCH /jobs?id=eq.…` with `{"status":"in_progress"}`, which the grant and both policies permit) fires the trigger as `authenticated`, the insert into `job_status_history` is refused for want of both a privilege and a policy, and **the whole status update rolls back with `permission denied for table job_status_history`** — an error message that points at the wrong table and will cost an afternoon.

The RPC path is unaffected (`update_job_status` and `update_job_order` are `security definer`, so the trigger runs as the function owner), which is why this is MEDIUM rather than HIGH: the graded demo works. But §10's claim that the trigger "is its only writer" is only true if the trigger runs as the owner, and that is exactly what the document does not say. It is also the path the §9 box-7 smoke query (`update jobs set status = …` as a demo user) would take.

**Concrete fix.** Add the security context to §13.4 and to the 0004 migration description, one clause:

```sql
-- 0004_jobs_pricing_history.sql
create or replace function public.log_job_status_change() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status is distinct from old.status then
    insert into public.job_status_history (job_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return null;                       -- after trigger: return value is ignored
end $$;

create trigger jobs_log_status_change after update on public.jobs
  for each row execute function public.log_job_status_change();
```

and add one sentence to §13.4: *"`jobs_log_status_change` is `security definer` because `job_status_history` has no client insert grant; running as the table owner is what makes the trigger its only possible writer on every path, including a direct `PATCH` of `jobs.status`."* State in the same place that the other three triggers (`jobs_guard_worker_update`, `jobs_set_status_changed_at`, `touch_updated_at`) are invoker-rights, because they only inspect or modify `NEW` and need no privilege on any other table — so the difference reads as a decision rather than an oversight.

If the team would rather shrink the surface instead: drop `status` from the `authenticated` update grant on `jobs`, leaving `(deleted_at, updated_at)`, and route every status change through the two RPCs. That also works, but it makes `jobs_update_assigned_worker` decorative for status, so §10, §13.2 and §18.5's invariant row would each need a line changed — the definer trigger is the smaller edit.

### 2. NIT — §9's migration list says "both job triggers" for `0004`, but §13.4 defines four triggers on `jobs`

**Where:** §9, canonical filename list: `0004_jobs_pricing_history.sql  jobs + job_pricing + job_status_history + both job triggers`.

The third revision added `jobs_set_status_changed_at`, so `jobs` now carries `jobs_guard_worker_update`, `jobs_set_status_changed_at`, `jobs_log_status_change` and `touch_updated_at`. "Both" is stale, and the list is the thing an implementer works from.

**Fix:** `0004_jobs_pricing_history.sql   jobs + job_pricing + job_status_history + all four job triggers (guard → set_status_changed_at → touch_updated_at → log_status_change)`.

### 3. NIT — §5.6's list of deliberately shared hexes misses one that §5.1 declares, so `npm run check:contrast` fails on its first run

**Where:** §5.6 step 2 (*"three hexes are deliberately shared: `#65769D` … `#4D5E80` … `#0D1A33` …"*, with the rule *"a `TOKENS` entry whose hex appears in the CSS under a different primary name is reported as a drift error"*) versus §5.1 (*"`--dusk-900` and `--navy-600` are the same hex by construction; both names are kept"*).

`#2A3956` is declared twice in `globals.css` (as `--dusk-900` and as `--navy-600`) and is a fourth shared hex that §5.6 does not list. An implementer following §5.6 literally writes a checker that reports `#2A3956` as drift and exits 1 on the first run, against a stylesheet that is exactly what §5.3 prescribes.

**Fix:** in §5.6 step 2, change "three hexes" to "four hexes" and add the row: *"`#2A3956` is `--dusk-900` (primary) and `--navy-600`"*. Alternatively state the rule as "each `TOKENS` entry lists its primary name plus every alias name, and a hex found under a name in neither list is drift", which removes the need to keep a prose count in step with the ramps.

### 4. NIT — the month-boundary aggregates use `current_date` (UTC on Supabase) while the rest of the system is pinned to Asia/Manila

**Where:** §13.6 `DashboardSummarySchema` comments (`order_date in date_trunc('month', current_date)`, `expected_completion ≤ current_date + 7`), §21.3's seed rules and both seed assertions, §20's Reports presets — all `current_date`; against §11.3, which deliberately takes the job-code year from `now() at time zone 'Asia/Manila'`, and §16.1, which renders every date in Asia/Manila.

For roughly eight hours either side of a month boundary the Dashboard's "+N this month", the Reports "This month" preset and the displayed dates can disagree about which month it is. Harmless on 14 November; confusing if the demo is re-seeded on the 1st.

**Fix:** define one SQL expression and use it in `dashboard_summary()`, `report_summary()` and the two seed assertions:

```sql
-- "today", shop time
(now() at time zone 'Asia/Manila')::date            -- instead of current_date
```

Or, if that is more churn than it is worth, add one sentence to §13.6: *"month and week boundaries are evaluated in UTC; at a month boundary the Dashboard may differ from the Manila date for a few hours, which is accepted for this prototype."* Either resolves it; silence does not.

### 5. NIT — `esc()` does not strip `_`, although its comment claims to cover "the two wildcards"

**Where:** §3.2, `src/lib/queries/_filter.ts`: `const FORBIDDEN = /["\\,().:*%]/g;   // PostgREST filter metacharacters + the two wildcards`.

PostgREST's `ilike` becomes SQL `ILIKE`, where `_` matches any single character as well. Searching `MAT_001` therefore matches `MAT-001`, and `2_` matches `2"`. Nothing breaks and nothing leaks — the filter shape is still safe — but the comment overstates what the regex does, and the unit test in §22 would not catch it.

**Fix:** `const FORBIDDEN = /["\\,().:*%_]/g;   // PostgREST filter metacharacters + the three ILIKE wildcards (* % _)`, and extend the pinned test: `esc('MAT_001, 3/4"') === 'MAT 001 3/4'`.

### 6. NIT — `job_material_cost` is gated at `is_staff()`, while Requirement 14.8 says the material-cost figure is visible to `owner` only

**Where:** §8.4 and §13.6 (*"carries the same `is_staff()` gate"*) versus Requirement 14.8 (`[STRETCH]`: *"total material cost per completed job, visible to `owner` only"*).

Admin staff can call the function and therefore read a figure the requirement reserves for the owner. The worker protection (which is what the brief settled) is unaffected either way; this is the owner/admin line, on a `[STRETCH]` item.

**Fix:** pick one and write it down. Either tighten the gate — `if public.current_app_role() <> 'owner' then raise exception 'NOT_PERMITTED' …` — or keep `is_staff()` and add one sentence to §13.6: *"the function is staff-gated because the job-detail cost panel serves admin staff too; the Reports tile of Requirement 14.8 is rendered for `owner` only, in the page component."*

### 7. NIT — nothing in the design supports the "(removed)" customer marker that open decision O7 recommends

**Where:** `requirements.md` O7 (*"soft delete the customer, keep their job orders visible, and show the customer name with a '(removed)' marker on those jobs"* — still listed as open, to be built on the recommendation unless the user objects) versus §7.3's `v_jobs_list`, which projects `c.name as customer_name` and no deletion flag, and §13.5, which says nothing about a soft-deleted parent.

The jobs list and job detail therefore cannot distinguish a live customer from a removed one. The inner join is correct (a soft-deleted customer row still exists, so the job stays visible — the important half of O7 works), but the marker has nowhere to come from.

**Fix:** add one column to the view and one line to §20:

```sql
create view public.v_jobs_list … select …,
       c.name as customer_name,
       (c.deleted_at is not null) as customer_removed,   -- O7's "(removed)" marker
       p.full_name as assigned_name …
```

and render `customer_name` + a `(removed)` suffix when `customer_removed` is true. If O7 is instead being dropped for the deadline, say so in §20 and in the deviation register rather than leaving the requirement pointing at nothing.

---

## Verified assumptions

Each of these is a claim the design makes that I checked against the actual source rather than taking on trust.

**Package versions (§2) — all correct.** Re-read from `registry.npmjs.org/<pkg>/latest` on this machine: `next` 16.4.6, `react`/`react-dom` 19.3.1, `typescript` 7.0.2, `tailwindcss` and `@tailwindcss/postcss` 4.3.5, `shadcn` 4.23.0, `lucide-react` 1.71.0, `@supabase/supabase-js` 2.119.0, `@supabase/ssr` 0.12.7, `next-intl` 4.14.10, `react-hook-form` 7.91.0, `@hookform/resolvers` 7.0.5, `zod` 4.6.7, `sonner` 2.0.8, `vitest` 5.1.0, `@playwright/test` 1.65.0, `@axe-core/playwright` 4.14.0, `eslint` 10.14.0, `eslint-config-next` 16.4.6, `eslint-plugin-jsx-a11y` 6.10.2, `supabase` CLI 3.1.0, `tsx` 4.23.15, `class-variance-authority` 0.7.1, `@vitejs/plugin-react` 6.3.0, `tw-animate-css` 1.4.0. §2's next-intl bump from 4.14.9 to 4.14.10 is real.

**Supabase + Next 16 auth surface (§2, §3.4, §14.1) — correct.** `supabase.com/docs/guides/auth/server-side/nextjs` fetched: `proxy.ts` 17 occurrences against 4 for the legacy `middleware.ts`; `getAll` 43; `setAll` 39; `getClaims` 37; `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 10; `NEXT_PUBLIC_SUPABASE_ANON_KEY` **0**. §24's own counts match mine exactly.

**`auth.enable_signup` defaults to `true` (§2's Auth box, §14.4) — correct and load-bearing.** `supabase.com/docs/guides/local-development/cli/config` states: name `auth.enable_signup`, **default `true`**, *"Allow/disallow new user signups to your project."* The design's insistence that owner-provisioning alone does not close the self-service door is right, and the fail-closed `requireUser()` in §14.3 is the correct second half.

**`supabase db push` flags and prompt behaviour (§21.4, §24) — correct, verbatim.** The CLI reference contains, as quoted: *"Before changing a hosted database, the command lists what it will do … and asks once for confirmation, defaulting to No. Pass `--yes` to confirm without a prompt; JSON output, piped input and agent runs need it. A `SUPABASE_YES` set in `supabase/.env` does not confirm…"*, plus `--include-seed` ("Include seed data from your config"), `--remote[=<ref|branch|url>]`, `-p, --password`, and `SUPABASE_DB_PASSWORD` for non-interactive runs.

**`supabase gen types` selector (§2, §21.4 step 5) — correct.** `supabase.com/docs/guides/api/rest/generating-types` shows `npx supabase gen types typescript --remote="$PROJECT_REF" --schema public > database.types.ts`; `--project-id` does not appear on that page.

**next-intl `requestLocale` is legacy (§16.1) — correct, verbatim.** `next-intl.dev/docs/usage/configuration`: *"Before Next.js introduced `next/root-params`, the `requestLocale` parameter was used to read the `[locale]` segment from the middleware… This is considered legacy and is no longer recommended."* The cookie-based `getRequestConfig` pattern the design uses is the documented fit for an app whose language is a stored preference.

**PostgREST cannot OR a parent column against an embedded one (§3.2, §7.3) — correct in substance.** `docs.postgrest.org/en/v13/references/api/resource_embedding.html`: *"In order to filter the top level rows you need to add `!inner` to the embedded resource"* — i.e. AND semantics. The two flattened `security_invoker` views are the right workaround, and they are the reason the toolbar search is a single-table filter.

**All 44 distinct contrast ratios in §5.4 — recomputed, all correct.** Sampling the ones that carry decisions: `#0D1A33`/`#FFFFFF` 17.32 · `#C14D1C`/`#FFFFFF` 4.83 · `#C14D1C`/`#F0F3FB` 4.35 (the rejected row) · `#A13E15`/`#F0F3FB` 5.88 · `#0D1A33`/`#FF6A2B` 6.06 · `#FF6A2B`/`#FFFFFF` 2.86 · `#9FB4E3`/`#FFFFFF` 2.08 · `#65769D`/`#FFFFFF` 4.53 · `#65769D`/`#F8FAFD` 4.34 · `#E0E7F6`/`#FFFFFF` 1.24 · `#E0E7F6`/`#F8FAFD` 1.19 · `#1F2C48`/`#E8EEFB` 11.94 · `#0D1A33`/`#E0E7F6` 13.96 · `#0F7A4A`/`#E0E7F6` 4.34 · `#C14D1C`/`#E0E7F6` 3.90 · `#0A0A0A`/`#FFFFFF` 19.80 · `#FFFFFF`/`#000000` 21.00 · `#FFFFFF`/`#84300E` 8.71. The derived accessible orange `#C14D1C` at 4.83:1 satisfies Requirement 18.5, the brief's "~2.9:1" and "~2.1:1" warnings are reproduced exactly, and every pairing marked ✅ clears its stated threshold. The table also keeps its failing pairings (11, 14, 40, 42, 43, 50, 51) visible with the adopted replacement beside them, which is what makes the `outline`/`secondary` button edge and the progress-bar colour defensible.

**Secret hygiene — clean.** Grepped every `.md` and `.json` in the workspace for `sb_secret_[A-Za-z0-9_-]+`: no live key anywhere. In `design.md` the token appears only as the `check-secrets.ts` grep pattern and in the key-format note. `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` carries the real publishable value, which is correct (it ships in the browser bundle anyway). §2's four variables match Requirement 26.1 exactly; `ANON_KEY` and `SERVICE_ROLE_KEY` appear nowhere except as the deprecated names being rejected.

**Brief decisions, each honoured:**

- *Worker permissions, variant B.* §10's `jobs_select_all` (`using (true)`) + `jobs_update_assigned_worker` (`role = 'worker' and assigned_to = auth.uid() and status <> 'completed'`) + the `jobs_guard_worker_update` trigger for the column half + no delete grant + `stock_out` allowed for all roles with `p_job_id` mandatory for a worker (§12.2 steps 3 and 6) + read-only materials + no Reports/Users nav or data path. Matches the settled "slightly wider" variant line by line.
- *Owner-provisioned accounts only.* §14.4 `POST/PATCH /api/admin/users`, caller's `owner` role verified from the request's own cookies, secret key server-only behind `import "server-only"`, plus the sign-up setting and fail-closed `requireUser()`. The username→email resolution runs through the admin client, so no username oracle exists and `anon` gets no `profiles` reach; every failure returns the single generic `INVALID_CREDENTIALS` (§14.2 step 4), including the deactivated-account and missing-secret-key cases.
- *New key env names, `.env.local` blank secret, `.env.example` placeholders, gitignore, rotation task.* §2, §23.
- *"Automatically expose new tables" OFF.* §9's seven-box checklist is mandatory per migration, the §10 grants matrix writes out the exact statement for every object including the three views, and the box-3 clause "views count" is correct: a `security_invoker` view inherits policies, not privileges.
- *Logo.* §5.7: navy rounded container, fixed 40/64 px, `alt="RJM Furniture logo"`, SVG/PNG recommendation recorded, no invented logo.
- *Demo seeding.* §21: Admin API for the three accounts (because `auth.users` cannot be hand-inserted safely), SQL for business data, documented order with a block-0 guard, `on conflict` idempotency, worker seeded with `simple_mode: true`, credentials in README and in the `NEXT_PUBLIC_DEMO_MODE` panel only.
- *Stock RPC atomicity.* §12: `select … for update` on the material row, both writes in one function body, `check (current_stock >= 0)` as the backstop, no client `insert` on the ledger and `current_stock` in no `update` grant, `OUT_OF_STOCK` and `INSUFFICIENT_STOCK` as distinct codes with the available quantity in `detail`. Requirement 12.11's no-lost-update is satisfied by the row lock and asserted by an integration test.
- *Code concurrency and the per-year JO reset.* §11: sequences for `MAT`/`TXN` with gaps accepted and explained; `insert … on conflict (year) do update … returning` for `JO-YYYY-NNN`, which is one statement and therefore race-free; the reset is structural (the first job of 2027 inserts its own counter row); the year comes from Manila time; `unique` on `job_code` as the backstop with a heal-then-retry loop whose explanation (the handler runs after the attempt's rollback, so the counter fix must live there) is correct PL/pgSQL reasoning.
- *Cost-column protection.* §8: money in three one-to-one tables behind ordinary staff-only policies, with the trade-off argued against **both** mechanisms the brief offered — column `GRANT`/`REVOKE` is structurally incapable here because Supabase puts every signed-in user in the single `authenticated` role (correct), and role-filtered views fail silently if one query forgets the view (correct). The requirement amendment this forces (4.1, 4.5, 22.1) is declared, carried into `requirements.md`, and gated as the first stop point of Phase 2 rather than assumed.

**Required sections and diagrams — all present.** Architecture with route groups, server/client split, four data-access layers and the zod sharing rule (§3); tokens with hexes and the contrast table (§5); component inventory with allowed shadcn variants (§6); folder structure (§4); schema with SQL sketches (§7); every RLS policy in plain English plus a grants matrix (§10); stock RPC (§12); code generation (§11); auth and username resolution (§14); preference mechanism (§15); i18n namespaces (§16); responsive and table strategy (§17); error handling, toasts and undo (§18); testing (§22); screen-by-screen with purpose line, personas and primary action (§20); versions and verification notes (§2, §24). Three Mermaid diagrams: auth sequence, stock-out flowchart, screen/navigation map.

**All 22 indicators have a design mechanism.** 1 (§5.4, 16 px base, high-contrast block), 2 (44 px minimum baked into every button size, skip link in `AppShell`, Radix focus trap, `aria-current`, drawer focus return), 3 (`show_labels`, `DataTable`'s enforced `<caption>`/`scope`, logo alt), 4 (plain glossary vocabulary, Taglish register, Simple mode default for workers), 5 (§15, every switch changing rendered HTML on the first paint), 6 (§16 with pinned `en-PH` dates, `₱` money, shop units, drafts flagged), 7 (`PageHeader` purpose lines, dashboard quick actions, `EmptyState` on every list and section), 8 (`loading.tsx` per route, `Suspense` per section, toast on every write), 9 (§18.6 confirm dialogs, 8-second undo, disabled-with-reason, dirty-form guard, quantity guards), 10 (`StepForm`, helper text, first-run tips in `tips_dismissed`), 11 and 12 (one token set, one type/spacing/radius scale, one icon set, variants defined once), 13 (the dusk palette), 14 (§5.5 colour+icon+label, responsive tables that stay tables), 15 and 16 (§20's screen table with personas), 17 (`docs/design-rationale.md` plus a deviation register that actually names each deviation), 18 (§23 future work), 19 (§19 diagrams, feedback box and dialog), 20 (`docs/heuristic-checklist.md` — content is Requirement 25.3's deliverable, which is the right place for it), 21 (`PAGE_SIZE = 5`, Simple mode, progressive disclosure), 22 (`APP_VERSION` single constant, `CHANGELOG.md`, feedback review and export, `docs/usability-test-plan.md`).

**Wireframe defects handled as the brief asked.** Alerts banner count computed from the same `v_material_status` query as the table; the Filipino-deferral note deleted and both languages shipped; Simple mode added; the 29/8/5 status split corrected to 29/7/5/1 so the On Hold job in the wireframe's own list is representable, with Requirement 7.8 amended rather than quietly outvoted. Each is recorded for the deviation register.

**Seed arithmetic is self-consistent.** 64 opening `adjustment` rows plus 45 movement rows = 109, which is what the `sum(delta) = current_stock` assertion needs for 64 materials; materials are **inserted** with their final stock and never updated, so `materials_block_stock_write` stays absolute (the alternative escape hatch is rejected in writing); `TXN-00xx` for openings keeps the wireframe's `TXN-1054…1058` at the top of page 1; `setval(64)` / `setval(1094)` and the `greatest(…, 42)` counter upsert prevent any collision with hand-added codes in either direction; every date is relative to `current_date` with a second assertion that fails loudly if an edit de-centres the month. The reason the seed cannot call `record_stock_movement` 109 times (it would stamp `created_at` with "now" and destroy the reporting month) is stated.

---

## Unverified / wrong assumptions

- **Wrong (finding 1):** *"Rows are written only by the trigger on `jobs`, so the history cannot be faked or edited"* (§10) is true of the RPC paths but not of the direct `PATCH` path the same section grants, because the trigger's security context is unstated and the default is invoker-rights. This is the one blocking item.
- **Unverified, and flagged by the author (acceptable):** TypeScript 7.0.2 has not compiled this codebase (§2 carries a one-line fallback to `typescript@5.9.x`); `@theme inline` re-scaling `text-*` utilities at runtime has not been executed (§22 compensates by asserting a computed `font-size` of 20.8 px, not just the data attribute); GoTrue's acceptance of `@rjm.local` addresses is untested (§21.2 states a one-constant fallback); GoTrue's refusal *wording* for disabled sign-ups is deliberately not asserted in tests. All four are correctly scoped and none blocks Phase 1.
- **Unverified, reasoned from Postgres semantics rather than run (as the step requires), and flagged for the Phase-2 smoke queries:** the `set local app.stock_rpc` flag's visibility to `materials_block_stock_write` (sound — the trigger fires inside the same statement, and the explicit close makes the outcome the same whether or not the GUC is popped at function exit); the bare-table-name rule inside `on conflict do update`; `create policy` taking exactly one command, hence three policies per money table; `scale(numeric)` and `gen_random_uuid()` being available on the project's Postgres 15+. I found no error in any of these.
- **Minor overstatement (finding 5):** the `esc()` comment's "the two wildcards" is three.
- **Boundary assumption left implicit (finding 4):** `current_date` is UTC on Supabase, while the rest of the system is Manila-pinned.
- **Not checked by me, and not checkable here:** ICU's `fil` month rendering (the design's fix — pinning `formatDate()` to `en-PH` — makes Requirement 16.5 hold regardless of what ICU does, so the claim no longer carries weight); whether `db push --include-seed` runs the seed when no migrations are pending (the flag and its description are verified; the no-pending-migration case is not documented either way, and `npm run seed:reset` provides a second route to the same state).

---

## Verdict

**CHANGES_REQUESTED** — 1 MEDIUM, 6 NIT (mechanical rule: any HIGH or MEDIUM blocks).

To be plain about the size of it: finding 1 is one `security definer` clause plus two sentences in §13.4, and nothing else in the document moves. The six NITs are a stale word count, a missing entry in a list of shared hexes, a timezone sentence, one regex character, one gate-or-render clarification, and one view column. None requires rework of the architecture, the schema, the RLS design, the token system or the seed. If finding 1 is applied, I would expect the next pass to approve.
