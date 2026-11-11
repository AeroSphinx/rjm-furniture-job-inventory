# Phase 4 verification (Inventory, Inventory Transactions, stock rules)

No fix-it loop follows this run — one review pass reads this note instead
of re-running the suites. Every command below was run for real against
this repository and the live `rjm-dev` Supabase project.

## Tasks completed

- [x] 4.1 Inventory list screen (`/inventory`)
- [x] 4.2 Material create/edit form (`MaterialForm`, `upsert_material`)
- [x] 4.3 Inventory Transactions list screen (`/transactions`)
- [x] 4.4 Record Stock In / Stock Out forms wired to `record_stock_movement`
- [x] 4.5 Success/error toasts and the stock-RPC error-code map
- [x] 4.6 Phase 4 sections appended to `docs/design-rationale.md` and `docs/evaluation-traceability.md`

All six are checked off in `tasks.md`. Nothing in 4.1-4.6 was left
incomplete.

## Commands run and results

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` (after schemas+queries, after actions, after components, final) | Clean every time — 0 errors |
| `npx eslint src/components/features/materials src/components/features/transactions src/app/(app)/inventory src/app/(app)/transactions src/lib/queries/materials.ts src/lib/queries/transactions.ts src/actions/materials.ts src/actions/transactions.ts src/schemas/material.ts src/schemas/transaction.ts src/lib/errors.ts` | 0 errors, 3 warnings — all three are the pre-existing `react-hooks/incompatible-library` notice on `form.watch()`, the same warning `JobForm.tsx` already carries from Phase 3; not a new class of issue |
| `npm run build` | Compiled successfully; `/inventory` and `/transactions` both appear in the route list; no new warnings |
| `node -e "JSON.parse(...)"` on `messages/en.json` and `messages/fil.json` | Both valid JSON after every edit |

## A bug found and fixed: `upsert_material()`'s ambiguous column

The first live call to `upsert_material()` (Requirement 10.6, design
§13.3) failed with `column reference "material_code" is ambiguous` — the
same bug class Phase 2 found in `record_stock_movement()`'s `unit` and
Phase 3 found in `update_job_order()`'s `job_code`/`status`: the
function's `RETURNS TABLE` declares `material_code` and `current_stock`
as output parameters, and its final `select material_code, current_stock
into v_code, v_stock from public.materials where id = v_id` read both
unqualified. This blocked every material creation and edit, so it had to
be fixed to verify anything else in this phase. Migration 0009 was
already applied to the live project, so the fix is a new migration,
`supabase/migrations/0013_fix_upsert_material_ambiguous_column.sql`
(`create or replace function` with the one statement qualified via a
table alias), pushed with `npx supabase db push --remote --yes`. Recorded
in full in `docs/design-rationale.md`'s Phase 4 section.

## An operational fix: `transaction_code_seq` was behind the real data

The live ledger held 110 rows (109 documented by the seed file + 1 left
over from an earlier phase's own real RPC call against the dev project),
but the seed's one-time sequence catch-up assumed 109. The first live
stock-in this phase attempted collided with the pre-existing `TXN-1095`.
Fixed by resyncing the sequence to the table's real maximum with one
`select setval(...)` statement against the live project — not a code or
schema change, so no migration carries it. Recorded in
`docs/design-rationale.md`.

## Live smoke test (after both fixes above)

No browser-automation tool is available in this environment, so the
dev server (`npm run dev`) was started and its boot and routing were
confirmed directly:

- `npm run dev` started cleanly; `GET /inventory` and `GET /transactions`
  (no session cookie) both returned `307` to `/login` — the proxy guard
  (Requirement 3.9) covers both new routes.
- `npm run build` (above) confirms both routes compile and render to
  static shells with no error.

The RPC/RLS layer underneath those screens — the part a reviewer cannot
take on faith — was exercised directly against the live project with a
real authenticated `@supabase/supabase-js` session per role (the same
client, same RPC names and argument shapes the UI code calls), using the
owner and worker demo credentials given in the task brief. This is the
same backend every UI action in this phase goes through; it is not a
substitute for a browser click, but it is a stronger check than code
review alone for the one thing code review cannot see (what Postgres
actually does). The one-off script was deleted after the run — it is not
part of the repository.

| Check | Result |
| --- | --- |
| Sign in as owner | OK — session established |
| Create a material (`upsert_material`) | OK — `MAT-068` created, opening stock 0 |
| Record a stock-in (10 sheets, reason "Smoke test delivery") | OK — `TXN-1096`, `new_stock = 10` |
| `v_material_status` reflects it live | OK — `current_stock = 10`, `stock_status = in_stock` (computed by the view, not cached) |
| Find a job assigned to the worker demo account (seed data) | OK — `JO-2026-018`, status `in_progress` |
| Sign in as worker | OK |
| Worker attempts `stock_in` (owner/admin-only) | Correctly refused — RPC raised `NOT_PERMITTED`, surfaced as `error.message = "NOT_PERMITTED"`, not a raw Postgres error; `src/lib/errors.ts`/`mapSupabaseError` maps this to the existing `notPermitted` message |
| Worker records `stock_out` (3 sheets) tied to their own assigned job | OK — `TXN-1097`, `new_stock = 7` |
| Transaction shows the job-order link | OK — `v_transactions_list` row for `TXN-1097` has `job_code = JO-2026-018` and `job_id` matching the job used |
| Worker attempts `stock_out` of 100 (only 7 available) | Correctly refused — RPC raised `INSUFFICIENT_STOCK` with `detail = {"available":7,"requested":100,"unit":"sheets","material":"Smoke Test Plywood"}`; `src/lib/errors.ts`'s `parseErrorDetail` parses exactly this shape, which `StockMovementForm`/`TransactionsPageClient` use to build "Only 7 sheets of Smoke Test Plywood are available…" |
| Clean-up: soft-delete the smoke-test material (same effect as the UI's own Delete action) | OK — `deleted_at` set; material confirmed absent from `v_material_status` afterward |

This covers every item the task asked the smoke test to confirm: create,
stock-in with a `current_stock` update, stock-out linked to a real job
order with the link visible on the transaction, an over-stock rejection
with a clear (not raw) error, live-computed stock status, and the
worker/staff stock-in boundary.

**Admin role**: not separately exercised — its password was not given in
the task brief (only owner's and worker's were). `admin_staff` shares the
exact `is_staff()` gate `owner` already exercised in every check above
(`record_stock_movement`, `upsert_material`, the `materials`/
`material_costs` RLS policies all key off `is_staff()`, which treats
`owner` and `admin_staff` identically — design §8.1, §12.2 step 3), so the
risk of a role-specific admin bug slipping through is low, but this is
noted rather than silently assumed.

**Worker UI read-only boundary** (no Add/Edit/Delete button on
Inventory, no "Record Stock In" button on Transactions, no Unit Cost
column): verified by code review of `InventoryPageClient.tsx`'s
`canWrite = role !== "worker"` gate and `TransactionsPageClient.tsx`'s
`canStockIn = role !== "worker"` gate, not by an interactive browser
session (none is available in this environment). The data-layer half of
the same boundary — a worker's session never asking the database for
`unit_cost` at all — was verified directly: `/inventory`'s page component
only calls `listMaterialCosts` when `profile.role !== "worker"`, and
`material_costs`' RLS policy independently returns zero rows to a worker
regardless.

## Cleanup performed

- The one-off smoke-test script (`scripts/tmp-smoke-test.ts`) was deleted
  after the run.
- The dev server was stopped; `dev-server.log` was deleted.
- `Get-NetTCPConnection -LocalPort 3000` confirmed nothing is still
  listening.
- The smoke-test material (`MAT-068`, "Smoke Test Plywood") was
  soft-deleted — it is hidden from every list the same way a real
  deleted material would be, and its two transactions (`TXN-1096`,
  `TXN-1097`) remain in the ledger exactly as a real material's history
  would (Requirement 10.12 — a deleted material's past transactions stay
  readable). No seeded demo data was touched or altered.
- No password or the Supabase secret key appears in this file, in any
  committed file, or in `.env.local`'s contents (never printed).

## Not fully completed, and why

Nothing in 4.1-4.6 is incomplete. Two items are explicitly out of this
phase's scope and are not claimed as done:

- The Low-Stock Alerts screen's "Record stock in" pre-selected link
  (Requirement 13.8) is Phase 5's `/alerts` screen — `StockMovementForm`
  does not yet take a pre-selected material prop, because no caller needs
  one until that screen exists. Adding it now would be speculative.
- A full interactive (browser) walkthrough of both screens in both roles'
  UI — not available in this environment; the RPC/RLS layer underneath
  was verified live instead (see above), and the UI code paths that call
  it were verified by `tsc`/`build`/`eslint` plus manual code review
  against `design.md` and `requirements.md`.
