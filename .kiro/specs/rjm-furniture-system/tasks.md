# Tasks — RJM Furniture Job & Inventory Management System

Prototype v0.1 · Companion to `requirements.md` and `design.md` (design is final, revision 4 — do not reopen it)

This is a checklist, not prose. Each task is one focused coding or doc-writing session for a 2–4 person student team. Every task names the exact table, function, trigger, route, file or component it builds — all taken verbatim from `design.md` — and the requirement numbers and matrix indicator numbers it advances. Tiers (`[MUST]` / `[SHOULD]` / `[STRETCH]`) are carried through from `requirements.md`; nothing here is re-tiered. "Requirements" cites `requirements.md`; "Indicators" cites the 22-indicator mapping table there.

This is a student group project on a four-day clock, not production code — tasks stop at what the brief and the matrix actually ask for. No task below adds CI/CD, infra-as-code, multi-environment config, an extra feature flag beyond `NEXT_PUBLIC_DEMO_MODE`, or test coverage past Requirement 24's own list.

---

## Four-day execution order

Today is **Tuesday 10 November 2026**; the professor grades on or about **Saturday 14 November 2026**. The list below is every `[MUST]` task, in the order to attempt them, with a rough half-day budget per group. Work inside a phase can be split across the team (migrations in parallel with the shell, forms in parallel with lists), but a later phase's tasks assume the earlier phase's screens and functions already exist. `[SHOULD]` tasks are attempted opportunistically inside the same windows if a group finishes early; `[STRETCH]` tasks (migration 0012's schema, CSV/print, Vitest/Playwright breadth, Lighthouse/zoom/colour-blind evidence beyond the basic pass) are only attempted once every `[MUST]` and useful `[SHOULD]` is done.

**Day 1 — Tue 10 Nov, AM:** 1.1, 1.2, 1.3, 1.4, 1.5
**Day 1 — Tue 10 Nov, PM:** 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12 → *Phase 1 stop*

**Day 2 — Wed 11 Nov, AM:** *(confirm the Phase 2 gate below first)* 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9
**Day 2 — Wed 11 Nov, PM:** 2.10, 2.11, 2.13, 2.14, 2.15, 2.16, 2.17, 2.18 → *Phase 2 stop*

**Day 3 — Thu 12 Nov, AM:** 3.1, 3.2, 3.3, 3.4, 3.5, 3.6 → *Phase 3 stop*
**Day 3 — Thu 12 Nov, PM:** 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 → *Phase 4 stop*

**Day 4 — Fri 13 Nov, morning:** 5.1, 5.2, 5.3, 5.4, 5.7, 5.8 → *Phase 5 stop*, then 6.1, 6.3

**Day 4 — Fri 13 Nov, afternoon (reserved for documentation, accessibility evidence and deployment — do not let this slip):** 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.14, 6.15, 6.16, 6.17 → *Phase 6 stop*

Migration 0012 (2.12) is `[STRETCH]` and can be done whenever a gap opens on Day 2; it has no UI and nothing else depends on it. Reports' CSV/print (5.5, 5.6), the Feedback review page and Users role/reset actions (6.2, 6.4), and the Vitest/Playwright suites (6.12, 6.13) are `[SHOULD]` — fit them into Day 3–4 gaps, but never at the cost of a `[MUST]` task or of Day 4 afternoon's documentation window.

---

## Phase 1 — Scaffold, tokens, layout shell, i18n, auth

- [x] 1.1 [MUST] Scaffold the Next.js project and the git repository
  - Create the App Router project (TypeScript strict, Turbopack) and install the mandated stack exactly as versioned in design §2: Tailwind v4 + `@tailwindcss/postcss`, `shadcn` CLI (`--base radix`), `lucide-react`, `@supabase/supabase-js`, `@supabase/ssr`, `next-intl`, `react-hook-form` + `@hookform/resolvers` + `zod`, `sonner`, `vitest`, `@playwright/test` + `@axe-core/playwright`, `eslint-plugin-jsx-a11y`, `supabase` CLI, `tsx`.
  - `git init`; add `.gitignore` (`node_modules`, `.next`, `.env*.local`, `playwright-report`, `test-results`); first commit.
  - Requirements: 24.1, 24.2, 26.10
  - Indicators: 12, 18

- [x] 1.2 [MUST] Create the env files and the two-tier env validation
  - `.env.local` (project URL + publishable key, `SUPABASE_SECRET_KEY=` left blank), `.env.example` (placeholders only), per design §2's exact four variables.
  - `src/lib/env.ts`: `publicEnv` validated eagerly at module load; `requireSecretKey()` validated lazily and only inside `admin.ts`, the admin API route and `scripts/seed.ts`.
  - Requirements: 26.1, 26.2, 26.3, 26.4, 26.5
  - Indicators: 18

- [x] 1.3 [MUST] Declare the design-token system
  - `src/app/globals.css`: the full Dusk/Navy/Orange 50–900 ramps, the status-colour pairs, `--hc-text`/`--hc-sidebar`, the semantic shadcn tokens, and the `@theme inline` type-scale/spacing/radius tokens, exactly as design §5.1–§5.3.
  - `src/lib/design-tokens.ts`: export `TOKENS` and `PAIRINGS` matching the §5.4 contrast table (52 rows) so the checker in 1.4 has data to check.
  - Requirements: 18.1–18.8, 17.1, 17.4
  - Indicators: 1, 4, 11, 12, 13

- [x] 1.4 [MUST] Build the contrast-checking script
  - `scripts/check-contrast.ts`: compute each `PAIRINGS` ratio with the WCAG relative-luminance formula, assert every `TOKENS` hex appears in `globals.css` under its primary name, rewrite the `<!-- contrast:start -->…<!-- contrast:end -->` block in `docs/accessibility-report.md`, exit 1 on a failed pairing or a hex-name drift.
  - Add the `check:contrast` npm script; a Vitest unit test pins `contrastRatio()` against the published reference values (black/white = 21, `#777`/white = 4.48).
  - Requirements: 18.5, 18.6, 18.7, 24.8, 17.12
  - Indicators: 1, 14

- [x] 1.5 [MUST] Generate the shadcn components and pin their accessibility defaults
  - `npx shadcn add` for button, input, textarea, select, checkbox, radio-group, switch, card, table, dialog, alert-dialog, dropdown-menu, badge, sonner, skeleton, tabs, accordion, popover, tooltip, pagination, progress.
  - Fix the allowed variants/sizes from design §6.1 in the generated component files (44 × 44 px minimum on every button size; `outline`/`secondary` edges on `--input`, not shadcn's default `--border`).
  - Requirements: 17.2, 18.8, 18.9
  - Indicators: 2, 12

- [x] 1.6 [MUST] Build `BrandLogo` and the application-shell components
  - `src/components/layout/{AppShell,Sidebar,TopBar,MobileNav,SkipLink,FeedbackBox}.tsx`; `Sidebar` renders the exact nav array from design §20 (Dashboard, Job Orders, indented Customers, Inventory, Inventory Transactions, Low-Stock Alerts, Reports, Settings, Users, Feedback) plus the dashed feedback box and Logout; `BrandLogo` per design §5.7 (navy rounded tile, fixed 40/64 px, `alt="RJM Furniture logo"`).
  - `src/components/patterns/{PageHeader,Toolbar,DataTable,EmptyState,StatusBadge,StatCard,SectionCard,ConfirmDialog,FormField,StepForm,ErrorCard,UndoToast}.tsx` per design §6.2.
  - Requirements: 6.1–6.12, 17.5, 17.7, 17.8, 17.9, 17.10, 18.10, 18.11, 18.12, 19.1–19.6
  - Indicators: 1, 2, 3, 7, 8, 11, 12, 13, 14, 21

- [x] 1.7 [MUST] Set up `next-intl` with the cookie-based locale
  - `messages/en.json`, `messages/fil.json` (header comment in the Filipino file stating the strings are drafts, per 16.7); `src/i18n/request.ts` reading the `locale` cookie (no `[locale]` route segment, no `requestLocale`, per design §16.1); `en-PH` date formats and `₱` money formatting.
  - `<html lang>` bound to the active language on every page.
  - Requirements: 16.1, 16.3, 16.5, 16.7, 16.10, 16.11
  - Indicators: 4, 6

- [x] 1.8 [MUST] Set up the Supabase clients and the auth proxy
  - `src/lib/supabase/{client,server,admin}.ts` (the `getAll`/`setAll` cookie adapter; `admin.ts` behind `import "server-only";`).
  - `src/proxy.ts` (Next 16's renamed middleware) with the `PUBLIC_PATHS = ["/login"]` allowlist and `getClaims()` refresh; `src/app/page.tsx` redirecting to `/dashboard` or `/login`.
  - Requirements: 3.9, 26.1, 26.5
  - Indicators: 2

- [x] 1.9 [MUST] Build the Login screen and the "Forgot password?" dialog
  - `/login`: split layout (dark panel with the three role chips and dashed card; light card with the sign-in form, show/hide password toggle, Remember me, helper text, footer).
  - `ForgotPasswordDialog`: focus trap, `aria-labelledby`, closes on `Escape`, "Back to login" returns focus to the identifier field; names the owner as the real recovery path.
  - Requirements: 1.1–1.3, 1.8, 1.13, 2.1–2.6, 17.6
  - Indicators: 2, 7, 9, 13

- [x] 1.10 [MUST] Implement the `signIn` server action
  - `src/actions/auth.ts`: `LoginSchema`; the `@` vs. no-`@` branch (admin-client username lookup, politely degrading to the generic error when `SUPABASE_SECRET_KEY` is blank); a dummy `signInWithPassword` on a not-found lookup to equalise timing; the single `INVALID_CREDENTIALS` result for every failure.
  - `authCookieOptions(remember, options)` helper used by both this action and the proxy; the five-attempts-per-five-minutes throttle cookie.
  - Requirements: 1.4–1.7, 1.9–1.12, 2.5, 2.6
  - Indicators: 2, 9, 16

- [x] 1.11 [MUST] Implement `requireUser`/`requireRole` and the no-access screen
  - `src/lib/auth.ts`: fail-closed `requireUser()` (`getClaims()`, `cache()`-wrapped profile load, sign-out-then-redirect on a missing or deactivated profile so the proxy sees no session); `requireRole([...])`.
  - `/no-access` page with the "Back to Dashboard" link; confirm restricted data never reaches the page source for a direct navigation to a restricted route.
  - Requirements: 3.9, 3.10
  - Indicators: 2, 16

- [x] 1.12 [MUST] Append the Phase 1 sections to the two running documents
  - Add the Phase 1 entries to `docs/design-rationale.md` (logo handling, the sidebar's Customers/Feedback additions) and to `docs/evaluation-traceability.md` (screens/files built and evidence so far for indicators 1, 2, 3, 4, 6, 7, 9, 11, 12, 13, 16, 18).
  - Requirements: 25.2, 25.4, 25.11
  - Indicators: 17, 19

**STOP — review with user before continuing**

---

## Phase 2 — Migrations, RLS, seed data, generated types, Settings

> **Gate before 2.1.** Design §7.1 moves `quoted_price`, `unit_cost` and `unit_cost_at_time` off `jobs`/`materials`/`inventory_transactions` and into their own one-to-one tables (`job_pricing`, `material_costs`, `inventory_transaction_costs`), amending Requirements 4.1, 4.5 and 22.1. The design document states this amendment needs the user's approval before any migration that creates those tables is written. Confirm this with the user before starting 2.4. If declined, substitute the role-filtered-views fallback in design §8.3 for tasks 2.4–2.6 and for the grants matrix in 2.13.

- [x] 2.1 [MUST] Write migration `0001_helpers.sql`
  - `current_app_role()`, `is_staff()`, `touch_updated_at()`; apply the full §9 seven-box checklist (grants, `revoke … from public, anon` where the function must not be callable directly, plain-English comment, commented smoke query).
  - Requirements: 3.8, 26.6, 26.7
  - Indicators: 18

- [x] 2.2 [MUST] Write migration `0002_profiles.sql`
  - `profiles` (id = auth uid, `username` unique, `role`, `email`, `preferences` jsonb, `deactivated_at`) and the `profiles_guard_self_edit` trigger, including its `service_role`/`postgres`/`supabase_admin` exemption.
  - RLS on, explicit grants (narrow column list — no `email` read for anyone but the row's own owner/admin path), policies per the §10 table.
  - Requirements: 3.1, 5.10, 15.8, 22.2, 22.3
  - Indicators: 5, 16

- [x] 2.3 [MUST] Write migration `0003_customers.sql`
  - `customers` table, RLS, staff-only read/write policies, soft-delete column grant.
  - Requirements: 9.10, 9.11, 22.8
  - Indicators: 15, 16

- [x] 2.4 [MUST] Write migration `0004_jobs_pricing_history.sql`
  - `jobs`, `job_pricing`, `job_status_history`, and all four `jobs` triggers in firing order: `jobs_guard_worker_update` → `jobs_set_status_changed_at` → `touch_updated_at` → `jobs_log_status_change` (the last one `security definer`, because `job_status_history` has no client insert grant).
  - RLS, grants and policies per §10 (`jobs_select_all`, `jobs_update_staff`, `jobs_update_assigned_worker`, the staff-only `job_pricing` policies, the select-only `job_status_history` policy).
  - Requirements: 3.2–3.8, 4.1, 4.5, 9.9, 22.1, 22.4, 22.11
  - Indicators: 9, 16, 17, 18

- [x] 2.5 [MUST] Write migration `0005_materials_costs.sql`
  - `materials`, `material_costs`, `materials_block_stock_write` trigger; the column-level update grant on `materials` deliberately omits `current_stock`.
  - Requirements: 4.1, 10.8, 12.3, 22.1
  - Indicators: 9, 16

- [x] 2.6 [MUST] Write migration `0006_inventory_transactions.sql`
  - `inventory_transactions` (append-only, with the `delta` column) and `inventory_transaction_costs`; no insert/update/delete grant for `authenticated` on either.
  - Requirements: 4.1, 11.8, 22.1, 22.7
  - Indicators: 9

- [x] 2.7 [MUST] Write migration `0007_codes.sql`
  - `material_code_seq`, `transaction_code_seq`, `job_code_counters`, and `next_job_code()`, `next_material_code()`, `next_transaction_code()` with `revoke execute … from public, anon, authenticated` on all three.
  - Requirements: 9.3, 10.6, 11.7, 22.5, 22.6
  - Indicators: 18

- [x] 2.8 [MUST] Write migration `0008_stock_rpc.sql`
  - `record_stock_movement()` exactly per design §12: `security definer`, the `select … for update` row lock, all 11 algorithm steps, all 8 named error codes (`AUTH_REQUIRED` … `INSUFFICIENT_STOCK`).
  - Requirements: 12.1–12.13
  - Indicators: 8, 9, 20

- [x] 2.9 [MUST] Write migration `0009_job_material_rpcs.sql`
  - `create_job_order()`, `update_job_order()` (with the heal-then-retry counter loop), `update_job_status()`, `upsert_material()` (required `p_unit_cost`, opening-stock call into `record_stock_movement`).
  - Requirements: 9.1–9.9, 10.6, 10.7
  - Indicators: 8, 9, 20

- [x] 2.10 [MUST] Write migration `0010_views_and_reporting.sql`
  - `v_material_status`, `v_jobs_list`, `v_transactions_list` (each with its own `grant select`), `dashboard_summary()`, `report_summary()`, `job_material_cost()`.
  - Requirements: 7.6, 8.5, 11.3, 12.9, 14.4–14.9
  - Indicators: 7, 8, 15

- [x] 2.11 [MUST] Write migration `0011_usability_feedback.sql`
  - `usability_feedback` table; self-insert and read-own-rows policy; staff-read-all policy.
  - Requirements: 21.4, 21.5
  - Indicators: 19, 22

- [x] 2.12 [STRETCH] Write migration `0012_job_tasks.sql` (schema only)
  - `job_tasks` table with RLS and policies per settled decision D3; no application code reads it in v0.1.
  - Requirements: 22.9
  - Indicators: 18

- [x] 2.13 [MUST] Review grants and policies across all twelve migrations
  - Walk the §9 seven-box checklist and the §10 grants matrix object by object; confirm each migration's commented smoke query is present; run the "one allowed, one forbidden, one `anon`-key" spot check for each new table/view against the dev project.
  - Requirements: 3.8, 3.11, 24.10, 26.7
  - Indicators: 16, 17

- [x] 2.14 [MUST] Write `scripts/seed.ts` and seed the three demo accounts
  - Admin API create-or-update for owner/admin/worker (§21.2's table); profile upsert with role-appropriate default preferences (`simple_mode: true` for the worker); print the login table for the README.
  - Requirements: 15.13, 23.1–23.5
  - Indicators: 5, 22

- [x] 2.15 [MUST] Write `supabase/seed/010_business_data.sql` and seed the business data
  - The block-0 guard, then customers → materials (inserted with final `current_stock`) → jobs → `job_pricing` → the 109-row ledger (64 opening `adjustment` rows + 45 movement rows) → `inventory_transaction_costs` → the two consistency/date-centring assertions → the three counter catch-up statements, per design §21.3.
  - Requirements: 23.6–23.9
  - Indicators: 19, 22

- [x] 2.16 [MUST] Write `scripts/seed-reset.ts` and generate the TypeScript types
  - `seed-reset.ts` deletes the seeded UUID ranges and re-runs `supabase db push --include-seed --yes`; `npm run types` writes `src/types/database.types.ts`.
  - Requirements: 22.12, 23.9
  - Indicators: 18

- [x] 2.17 [MUST] Build the Settings page with working preferences
  - `/settings`: the four 2×2 cards (Language, Text Size, Display, Accessibility) plus the Simple mode toggle; `PreferenceForm` and the `savePreferences` server action; the `html[data-*]` attributes and the `prefers-reduced-motion` media-query override; the bottom "Save Preferences" bar.
  - Requirements: 15.1–15.16, 22.3, 20.13
  - Indicators: 1, 4, 5, 10

- [x] 2.18 [MUST] Append the Phase 2 sections to the two running documents
  - Add the Phase 2 entries to `docs/design-rationale.md` (the money-tables schema amendment, seed naming choices) and to `docs/evaluation-traceability.md` (evidence for indicators 5, 7, 8, 9, 15, 16, 17, 18, 19, 20, 22 advanced so far).
  - Requirements: 25.2, 25.4, 25.11
  - Indicators: 17, 19

**STOP — review with user before continuing**

---

## Phase 3 — Job Orders and customers

- [ ] 3.1 [MUST] Build the Job Orders list screen
  - `/jobs`: `SectionCard` header with the computed "N records · Updated just now" line; `Toolbar` (search + "Job Status: All" + "+ Add New Job Order"); `DataTable` with the eight fixed columns; `PAGE_SIZE = 5` pagination; `EmptyState` naming the search and offering "Clear filters".
  - Requirements: 8.1–8.13
  - Indicators: 7, 8, 11, 12, 21

- [ ] 3.2 [MUST] Build the job order create/edit form and the customer picker
  - `JobForm` (client), `src/schemas/job.ts`, wired to `create_job_order`/`update_job_order`; duplicate-customer warning; unsaved-changes guard; `StepForm` when the form has more than six fields or Simple mode is on.
  - Requirements: 9.1–9.11, 9.13, 20.5
  - Indicators: 8, 9, 10, 21

- [ ] 3.3 [MUST] Build the Customers screen and the customer create/edit dialog
  - `/customers` (staff only, the sidebar's indented sub-item): list plus "+ Add Customer" dialog; soft delete so a customer's past jobs stay visible (the inner join in `v_jobs_list` already keeps them, per design §7.3).
  - Requirements: 9.10–9.12
  - Indicators: 15, 16

- [ ] 3.4 [MUST] Build the job order detail view
  - `/jobs/[id]`: job details, assigned worker, the `job_status_history` panel, the list of materials issued to the job (its `stock_out` rows); price/cost fields rendered only for staff.
  - Requirements: 3.4–3.7, 9.12
  - Indicators: 7, 15, 16

- [ ] 3.5 [MUST] Implement worker status-only editing and soft delete with Undo
  - The worker's edit form shows only the status control, limited to jobs assigned to them, blocked once a job is `completed`; owner/admin delete confirmation naming the record, soft delete via `deleted_at`, and an 8-second Undo toast.
  - Requirements: 3.4–3.8, 9.8, 20.1–20.3, 20.12
  - Indicators: 9, 16, 20

- [ ] 3.6 [MUST] Append the Phase 3 sections to the two running documents
  - Add the Phase 3 entries to `docs/design-rationale.md` and `docs/evaluation-traceability.md` (evidence for indicators 7, 8, 9, 10, 11, 12, 15, 16, 20, 21 advanced so far).
  - Requirements: 25.2, 25.4, 25.11
  - Indicators: 17, 19

**STOP — review with user before continuing**

---

## Phase 4 — Inventory, Inventory Transactions, stock rules

- [ ] 4.1 [MUST] Build the Inventory list screen
  - `/inventory`: the eight fixed columns (no cost column for any role); the computed "Stock attention needed — N materials…" banner; search + "Category: All" + "+ Add Inventory Item"; worker read-only variant with no row actions.
  - Requirements: 10.1–10.5, 10.9, 10.11
  - Indicators: 7, 9, 12, 21

- [ ] 4.2 [MUST] Build the material create/edit form
  - `MaterialForm`, `src/schemas/material.ts`, wired to `upsert_material()`; required `unit_cost` for staff; opening-stock field; helper text stating stock changes only through a recorded transaction.
  - Requirements: 10.6–10.8, 10.12, 10.13
  - Indicators: 8, 9, 16

- [ ] 4.3 [MUST] Build the Inventory Transactions list screen
  - `/transactions`: the seven fixed columns; the "Inventory traceability…" info banner; search + "Transaction Type: All"; "+ Record Stock In" (staff) and "Record Stock Out" (all roles) buttons; no edit/delete on any row.
  - Requirements: 11.1–11.9, 11.11, 11.12
  - Indicators: 7, 9, 12, 21

- [ ] 4.4 [MUST] Build the Record Stock In / Stock Out forms wired to `record_stock_movement`
  - `StockMovementForm` (type-aware fields), `src/schemas/transaction.ts`; client-side quantity guard against available stock; the zero-stock option rendered disabled with its explanation; for a worker, the job-order picker limited to jobs assigned to them.
  - Requirements: 11.10, 12.4–12.7, 12.12, 12.13, 20.4, 20.10
  - Indicators: 8, 9, 20

- [ ] 4.5 [MUST] Wire the success/error toasts and the stock-RPC error-code map
  - `src/lib/errors.ts`: map every code from design §12.5/§18.2 to an i18n key present in both message files; success toast naming the material, the quantity and the new stock level (Requirement 12.10).
  - Requirements: 12.10, 20.6–20.9, 20.11
  - Indicators: 8, 9, 20

- [ ] 4.6 [MUST] Append the Phase 4 sections to the two running documents
  - Add the Phase 4 entries to `docs/design-rationale.md` and `docs/evaluation-traceability.md` (evidence for indicators 7, 8, 9, 12, 16, 20, 21 advanced so far).
  - Requirements: 25.2, 25.4, 25.11
  - Indicators: 17, 19

**STOP — review with user before continuing**

---

## Phase 5 — Dashboard, Low-Stock Alerts, Reports, CSV and print

- [ ] 5.1 [MUST] Build the Dashboard greeting, KPI grid and quick actions
  - `GreetingCard` using `greetingName()`; the six `StatCard`s fed by `dashboard_summary()`; role-filtered quick actions (hidden, not disabled, for a worker); `loading.tsx` plus per-section `<Suspense>` for the three streaming children.
  - Requirements: 7.1–7.6, 7.11–7.13
  - Indicators: 7, 8, 11, 15

- [ ] 5.2 [MUST] Build the Recent Job Orders, Job Status Overview and Recent Inventory Activity panels
  - Recent jobs table with a "View all jobs →" link; one progress bar per job status present in the data (up to four, per the amended Requirement 7.8); recent-activity rows with a direction icon and the "Stock Out · 12 board ft · JO-2026-018" line shape.
  - Requirements: 7.7–7.10
  - Indicators: 7, 8, 14, 15

- [ ] 5.3 [MUST] Build the Low-Stock Alerts screen
  - `/alerts`: the computed banner and the two advisory notices; the table sorted out-of-stock-first then by shortfall (the `v_material_status` order from design §20); "Record stock in" link (absent for a worker); a positive empty state when nothing is short.
  - Requirements: 13.1–13.10
  - Indicators: 7, 9, 15, 21

- [ ] 5.4 [MUST] Build the Reports screen (on-screen)
  - `/reports` (owner/admin only): the date-range preset select, Job Order Summary tiles, Inventory Summary, Most Frequently Used Materials, Low-Stock Materials Report, the fixed footer line; `report_summary()` wired through.
  - Requirements: 14.1–14.9, 14.12–14.14
  - Indicators: 7, 15, 16

- [ ] 5.5 [SHOULD] Add CSV export to Reports
  - "Export CSV" button; `src/lib/csv.ts` escaping commas, quotes and newlines; filename containing the selected range.
  - Requirements: 14.10
  - Indicators: 8

- [ ] 5.6 [SHOULD] Add the print stylesheet for Reports
  - `@media print` rules hiding the sidebar/top bar/toolbars, keeping the brand header, A4 portrait, repeating table header rows.
  - Requirements: 14.11
  - Indicators: 13, 14

- [ ] 5.7 [MUST] Wire the sidebar Low-Stock badge to the same computed source
  - Badge reads the same `v_material_status` count the Alerts banner and table use, with an assistive-technology text equivalent; confirm no count anywhere in the app is hardcoded.
  - Requirements: 6.2, 13.3
  - Indicators: 2, 9

- [ ] 5.8 [MUST] Append the Phase 5 sections to the two running documents
  - Add the Phase 5 entries to `docs/design-rationale.md` (the alerts-count and status-bar deviations) and `docs/evaluation-traceability.md` (evidence for indicators 2, 7, 8, 9, 13, 14, 15, 16, 21 advanced so far).
  - Requirements: 25.2, 25.4, 25.11
  - Indicators: 17, 19

**STOP — review with user before continuing**

---

## Phase 6 — Usability feedback, documentation, accessibility, polish, deployment

- [ ] 6.1 [MUST] Build the "+ Add observation" dialog and the feedback-capture path
  - `ObservationDialog` (current page pre-filled and editable, rating 1–5 required, note optional up to 1,000 characters); insert into `usability_feedback`; thank-you toast; on failure the dialog stays open with the text preserved.
  - Requirements: 21.1–21.5, 21.9
  - Indicators: 19, 22

- [ ] 6.2 [SHOULD] Build the Feedback / Observations review page
  - `/feedback` (owner/admin): table of every observation sortable by date and rating, filterable by page; CSV export.
  - Requirements: 21.6, 21.7, 21.8
  - Indicators: 19, 22

- [ ] 6.3 [MUST] Build the Users management page: list and create
  - `/users` (owner only): data table with a caption; "+ Add User" form (full name, username, role, temporary password — no email field, per design §14.4); `POST /api/admin/users` using the admin client; username-taken inline error; success toast naming the created user.
  - Requirements: 5.1–5.7, 5.11
  - Indicators: 16

- [ ] 6.4 [SHOULD] Add role change, password reset and deactivate to the Users page
  - `PATCH /api/admin/users` (the dual-client write from design §14.4: admin client for `auth.users`, caller's cookie-bound client for `profiles`); block an owner from demoting or deactivating themselves; confirmation dialog before each change.
  - Requirements: 5.8–5.10
  - Indicators: 9, 16

- [ ] 6.5 [MUST] Complete the Filipino message file and `docs/translation-review.md`
  - Fill `messages/fil.json` to full coverage in workshop Taglish (informal-polite, short sentences), keeping the English domain terms fixed by Requirement 16.3; build/maintain the per-string `key | English | Filipino draft | reviewed? | reviewer note` table.
  - Requirements: 16.1, 16.2, 16.4, 16.6–16.9, 25.7
  - Indicators: 4, 6

- [ ] 6.6 [MUST] Write `docs/personas-and-scenarios.md`
  - The three personas (Owner, Admin Staff, Carpenter/Worker) and three to five task scenarios, cross-referenced to the per-screen persona notes in design §20.
  - Requirements: 25.1
  - Indicators: 16, 19

- [ ] 6.7 [MUST] Write `docs/heuristic-checklist.md`
  - Nielsen's ten heuristics applied to each screen with a short note per heuristic per screen.
  - Requirements: 25.3
  - Indicators: 20

- [ ] 6.8 [MUST] Write `docs/usability-test-plan.md`
  - Tasks, success criteria, participants and metrics (task success, time on task, error count, SUS score).
  - Requirements: 25.6
  - Indicators: 19, 22

- [ ] 6.9 [MUST] Compile `docs/evaluation-traceability.md` into its final form
  - Pull together every phase's appended rows into one table covering all 22 indicators, each with what was implemented, the screen/file, and the evidence.
  - Requirements: 25.4
  - Indicators: 1–22 (final compilation)

- [ ] 6.10 [MUST] Compile `docs/design-rationale.md` into its final form
  - Consolidate every phase's deviation entries (the three wireframe defects, the sidebar's Customers/Feedback additions, the seed naming choices, the money-tables schema amendment) plus the future-work section (`job_tasks`, suppliers, payments, dark mode, a real logo asset — design §23).
  - Requirements: 25.2, 25.8
  - Indicators: 17, 18

- [ ] 6.11 [MUST] Run the manual accessibility passes and write `docs/accessibility-report.md`
  - Keyboard-only walkthrough of every screen; 200% zoom check; 320 px width check; colour-blindness simulation of the status set; paste in the contrast-script's output block; log any remaining issue with a plan.
  - Requirements: 17.3, 17.13, 19.7, 24.6, 24.7, 24.8
  - Indicators: 1, 2, 3, 14

- [ ] 6.12 [SHOULD] Write Vitest unit tests for stock and cost logic
  - `stockStatus()` boundary case, job material-cost arithmetic from `unit_cost_at_time`, code-format helpers (`MAT-007`, `TXN-1058`, `JO-2026-009`), `esc()` filter-stripping, `greetingName()`, CSV escaping.
  - Requirements: 24.3
  - Indicators: 20

- [ ] 6.13 [SHOULD] Write Playwright + axe-core end-to-end tests across both languages
  - One happy path per role; soft delete + Undo; the out-of-stock disabled explanation; language, text-size and Simple-mode switches; an axe run on every route with the `locale` cookie set to `en` and to `fil`.
  - Requirements: 16.12, 17.14, 24.4, 24.5
  - Indicators: 2

- [ ] 6.14 [MUST] Write `scripts/check-secrets.ts` and `scripts/check-translations.ts`; wire `npm run verify`
  - Secret-pattern grep across the repository; missing-translation-key check across both message files; the `verify` script chaining `tsc --noEmit`, `next lint`, `check:contrast`, `check:secrets`, `check:translations`.
  - Requirements: 16.10, 24.9, 26.3
  - Indicators: 18

- [ ] 6.15 [MUST] Write the README
  - Project purpose, setup, the four env vars, running migrations, seeding order (including the `npm run seed:reset` pre-grading step), the three demo-account logins with the Simple-mode-on note, test commands, deployment, and the Supabase secret-key rotation reminder.
  - Requirements: 25.9, 26.9
  - Indicators: 17

- [ ] 6.16 [MUST] Deploy to Vercel and record the URL
  - Configure the four env vars on Vercel (`NEXT_PUBLIC_DEMO_MODE=true`); re-confirm the two Supabase dashboard settings ("Automatically expose new tables" OFF, "Allow new user signups" OFF); deploy; record the URL in the README and add the `CHANGELOG.md` entry.
  - Requirements: 6.10, 21.10, 26.8
  - Indicators: 22

- [ ] 6.17 [MUST] Append the final Phase 6 sections and close out `CHANGELOG.md`
  - Add the last entries to `docs/design-rationale.md` and `docs/evaluation-traceability.md`; add the Phase 6 `CHANGELOG.md` entry; confirm the `APP_VERSION` constant matches the sidebar box, the login footer, the Dashboard chip and the changelog everywhere.
  - Requirements: 25.2, 25.4, 25.10, 25.11
  - Indicators: 17, 19, 22

**STOP — review with user before continuing**
