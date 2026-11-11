# Phase 5 verification — Dashboard, Low-Stock Alerts, Reports, CSV and print

Base commit: `f770fed` (Phase 4, approved, pushed). This note records the exact commands run and their results so the reviewer can read this instead of re-running the suite.

## 1. Static checks

```
npx tsc --noEmit
```
Result: clean (no output), run twice during the phase — once after 5.1-5.4's queries/components, again after 5.5-5.7's CSV/print/pre-select wiring.

```
npm run build
```
Result: succeeded both times it was run. Route list included the three new routes:
```
├ ○ /alerts
├ ○ /dashboard
├ ○ /reports
```

```
npm run lint
```
Result: 3 errors / 6 warnings, all pre-existing in `LoginForm.tsx` (Phase 1, `jsx-a11y` rules) and the `react-hooks/incompatible-library` warnings on `form.watch()` in `JobForm.tsx`/`MaterialForm.tsx`/`PreferenceForm.tsx`/`StockMovementForm.tsx` (React Compiler note, pre-existing from Phase 3/4). No new lint errors or warnings on any file this phase added or touched.

## 2. A real bug `tsc`/`npm run build` could not catch

A production server (`next build` + `next start`, chosen over `next dev` because the dev server's HMR WebSocket could not complete its handshake in this sandboxed environment and silently left the client bundle un-hydrated) rendered `/dashboard` and `/alerts` as a generic "This page couldn't load" error. The server log showed the real cause:

```
⨯ Error: Functions cannot be passed directly to Client Components unless you
explicitly expose it by marking it with "use server". Or maybe you meant to
call this function rather than return it.
  {key: ..., header: ..., priority: ..., cell: function cell}
```

Both `JobsOverviewSection.tsx` (Dashboard) and `alerts/page.tsx` are Server Components that built a `DataTable` `columns` array containing `cell` render functions and passed it straight into `<DataTable>`, which is `"use client"`. A function cannot cross that boundary. Fixed by moving the `columns` definition into two new small client components — `src/components/features/dashboard/RecentJobsTable.tsx` and `src/components/features/alerts/AlertsTable.tsx` — that take plain row data as props and build `columns` internally, the same shape every other `DataTable` caller (`JobsPageClient`, `InventoryPageClient`, `TransactionsPageClient`) already uses. Recorded in `docs/design-rationale.md`'s Phase 5 section. After the fix, a clean rebuild + `next start` rendered both pages correctly (see §3 below).

## 3. Live smoke test (production build, real dev project, no destructive SQL)

Commands:
```
npm run build
npx next start                         # background, port 3000
node --env-file=.env.local <script>    # a throwaway Playwright script, deleted after the run
```

### Dashboard vs. live DB (signed in as `owner`)

Direct DB query used for comparison:
```
npx supabase db query --remote --yes "select dashboard_summary();"
```
Result: `jobs_total:42 jobs_pending:7 jobs_in_progress:5 jobs_completed:29 jobs_on_hold:1 jobs_this_month:7 due_this_week:2 completion_rate:69 materials_total:64 category_count:7 low_stock_count:3 out_of_stock_count:1 txn_this_month:48`.

Dashboard UI (same request, rendered HTML):
| KPI | UI value | UI sub-note | DB value | Match |
| --- | --- | --- | --- | --- |
| Total Job Orders | 42 | +7 this month | `jobs_total:42`, `jobs_this_month:7` | ✓ |
| Pending Jobs | 7 | Needs scheduling | `jobs_pending:7` | ✓ |
| Ongoing Jobs | 5 | 2 due this week | `jobs_in_progress:5`, `due_this_week:2` | ✓ |
| Completed Jobs | 29 | 69% completion rate | `jobs_completed:29`, `completion_rate:69` | ✓ |
| Inventory Items | 64 | Across 7 categories | `materials_total:64`, `category_count:7` | ✓ |
| Low-Stock Materials | 4 | Action required | `low_stock_count:3 + out_of_stock_count:1 = 4` | ✓ |

Job Status Overview bars: Pending 7·17%, In Progress 5·12%, On Hold 1·2%, Completed 29·69% — four bars (the amended Requirement 7.8), sums to 42, percentages match `round(100*count/42)`. Recent Job Orders table rows (JO-2026-005/006/018/004/003) match `dashboard_summary().recent_jobs` exactly, same order. Recent Inventory Activity rows match `recent_transactions` exactly (material, type, quantity, unit, date, em dash where `job_code` is null).

### Low-Stock Alerts banner/badge vs. live DB

Direct DB query:
```
npx supabase db query --remote --yes "select id, material_code, name, category, current_stock, minimum_level, unit, stock_status, shortfall, updated_at from v_material_status where stock_status in ('out_of_stock','low_stock') order by (stock_status='out_of_stock') desc, shortfall desc, name asc;"
```
Result: 4 rows — `2" Common Nails` (out_of_stock, shortfall 5), `Mahogany Lumber` (low_stock, shortfall 7), `Clear Varnish` (low_stock, shortfall 2), `Wood Glue` (low_stock, shortfall 2).

UI result: Alerts banner read "4 materials need attention" / "1 out of stock · 3 below minimum level"; the table listed the same 4 materials in the same order; the sidebar badge showed "4" on the same request. Dashboard's Low-Stock Alerts preview (sliced to 3) showed the first three of the same ordered list (Common Nails, Mahogany Lumber, Clear Varnish). All four counts agree, confirming Requirement 13.3/5.7.

### Reports vs. live DB

Direct DB query:
```
npx supabase db query --remote --yes "select report_summary(date_trunc('month', current_date)::date, current_date::date);"
```
Result: `jobs_total:7 jobs_completed:6 jobs_pending:0 jobs_in_progress:1 materials_total:64 category_count:7 low_stock_count:4 txn_in_range:23`, `top_materials` = Mahogany Lumber 106 board ft / 3/4" Marine Plywood 33 sheets / 1.5" Wood Screws 10 boxes / 3" Common Nails 7 kg, `low_stock` = the same 4 rows as above.

UI result (default "This month" preset, Nov 1–11, 2026): Job Order Summary tiles 7/100%, 6/86%, 0/0%, 1/14% (percentages computed client-side from the same counts — `round(6/7*100)=86`, `round(1/7*100)=14`); Inventory Summary 64/7/4/23; Most Frequently Used Materials and Low-Stock Materials Report rows match verbatim. Footer read "RJM Furniture · Academic HCI Prototype" / "Keyboard-friendly · High contrast · Descriptive labels" (Requirement 14.13, verbatim).

### CSV export

Clicking "Export CSV" downloaded `rjm-report_2026-11-01_to_2026-11-11.csv` (filename contains the range, Requirement 14.10). First lines: `Job Order Summary␍␊Metric,Count,Percentage␍␊Total Job Orders,7,100%␍␊Completed Jobs,6,86%…`. The file contains `3/4" Marine Plywood` correctly quoted/escaped (a real seeded name with an embedded double quote), confirming the escaping path handles quotes on real data, not only on a synthetic test string.

### Print stylesheet

`page.emulateMedia({ media: "print" })` on `/reports`: the sidebar (`aside`) and top bar (`header`) were not visible; the Job Order Summary card's text content was still present; the Reports-only print brand line ("RJM FURNITURE" + the selected range) inside `<main>` became visible. Confirms `@media print` hides the chrome, keeps the content and keeps a brand identifier on the page once the top bar is gone.

### "Record stock in" pre-select (Requirement 13.8)

The Alerts table's link for `2" Common Nails` resolved to `/transactions?stockIn=5c7c0f06-8e8d-4c1b-96de-a0fbf396cd5e` (that material's real id). Clicking it navigated to `/transactions` and opened the "Record Stock In" dialog automatically (confirmed by the dialog's content appearing in the rendered page without a second click).

### Worker restrictions (signed in as `worker`)

- Dashboard: no "+ Add Job Order" / "+ Add Inventory Item" buttons anywhere in the rendered HTML (hidden, not disabled — Requirement 7.3). Because Simple mode defaults on for the worker, the Recent Job Orders table also dropped its `detail`-priority "Due Date" column automatically — confirms Phase 2's Simple-mode CSS integrates correctly with this phase's new table.
- Sidebar nav for the worker: Dashboard, Job Orders, Inventory, Inventory Transactions, Low-Stock Alerts (badge "4"), Settings — no Customers, Reports or Feedback review entry, matching design §20's nav table.
- Alerts: `getByRole("link", { name: /Record stock in/i }).count()` = 0 (Requirement 13.8's worker exception).
- Reports: navigating to `/reports` redirected to `/no-access` before any report data loaded (Requirement 14.2, `requireRole`).

## 4. What was not re-tested live

- `admin_staff` role: not exercised interactively this phase (reasoned by code sharing with `owner` through `is_staff()` for everything Phase 5 touches — `report_summary()`'s gate, the Alerts/Dashboard queries carry no role branch at all). Same reasoning Phase 4's review recorded for the same gap.
- Forcing a live query failure to see the `ErrorCardRetry` path render: not done, since the only way to force `dashboard_summary()`/`report_summary()` to fail live would be to break a working RPC on the shared dev project. Verified by code review instead (each of the three Dashboard sections and the Reports page wrap their RPC call in `try/catch` and return `ErrorCardRetry` on failure).
- Vitest unit tests: none added this phase — `csv.ts`'s escaping and `dateRange.ts`'s range resolution are plain, dependency-free functions suitable for Requirement 24.3's later Vitest pass (task 6.12), which is explicitly a later phase's task, not 5.1-5.8's.

## 5. Environment notes for the next person

- `npx next dev --turbopack` could not be used for interactive smoke testing in this sandbox: the HMR WebSocket handshake fails (`net::ERR_INVALID_HTTP_RESPONSE`), which left the client bundle never actually attaching event handlers, so every click fell back to a native (and useless) form GET. Production mode (`next build` + `next start`) hydrates normally and was used instead. This is an environment limitation, not an application bug — record it here so a future session does not waste time re-diagnosing it.
- Chromium needed `--no-sandbox` and the server needed to be addressed as `127.0.0.1` rather than `localhost` for Playwright to reach it in this sandbox.
- The dev and production servers were both stopped at the end of this session; no node process was left running. The throwaway Playwright scripts (`.tmp-smoke.mjs`, `.tmp-smoke2.mjs`) and both server logs (`dev-server.log`, `prod-server.log`) were deleted before finishing.

## 6. Tasks not fully completed and why

None of 5.1-5.8 are incomplete. Task 5.8 (close out the two running docs) is this file's sibling edit, done in the same commit set.
