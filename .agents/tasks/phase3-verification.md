# Phase 3 verification note

Records what was run against the dev project (`rjm-dev`, ref
`twplmgailygbucbgjilc`) and the local build for the reviewer. No demo
password or the Supabase secret key appears anywhere below.

## 1. Tasks completed

All six: 3.1 (Job Orders list), 3.2 (create/edit form + customer picker),
3.3 (Customers screen + dialog), 3.4 (job order detail view), 3.5
(worker status-only editing + soft delete/Undo), 3.6 (this note plus the
`docs/design-rationale.md` and `docs/evaluation-traceability.md`
appends). All checked `[x]` in `tasks.md`.

## 2. A real bug found and fixed during this phase

`update_job_order()` (migration `0009_job_material_rpcs.sql`) raised
`column reference "job_code" is ambiguous` (Postgres `42702`) on every
real edit — its own `returns table (job_id, job_code, old_status,
new_status)` output parameters collided with unqualified reads of
`jobs.job_code`/`jobs.status` and `job_pricing.job_id`. This is the same
bug class Phase 2 found once in `record_stock_movement()`'s `unit`
column. Found by the Phase 3 smoke test actually editing a job order
end to end, not by re-reading the SQL (it reads correctly at a glance).
Fixed by qualifying both references to a table alias, committed in the
migration file itself (`create or replace function` is idempotent, so
re-applying it is safe) and re-applied to the live dev project with
`npx supabase db query --remote --yes --file supabase/migrations/0009_job_material_rpcs.sql`.
Full account in `docs/design-rationale.md`'s Phase 3 section.

## 3. TypeScript and build

```
npx tsc --noEmit   -> clean, no errors (run after every 1-2 tasks, and
                       again as the final check below)
npm run build      -> next build --turbopack succeeded
                       Routes: /, /_not-found, /customers, /jobs,
                       /jobs/[id], /login, /no-access, /settings
                       (proxy/middleware present)
npx eslint <changed files>  -> 0 errors, 1 pre-existing-pattern warning
                       (React Compiler + react-hook-form's watch(),
                       the same warning PreferenceForm.tsx already has)
```

## 4. Smoke test (real browser against the live dev project)

Run with Playwright's core driver against `next dev --turbopack` on
`localhost:3000`, signing in through the real `/login` page for both
roles (no mocking). The script itself was a throwaway harness, deleted
after the run along with the dev server's log — nothing from it remains
in the repository.

**Owner (`owner` / seeded password from `SMOKE_OWNER_PASSWORD`, never
written to a file):**

| Check | Result |
| --- | --- |
| Login via `/login` | PASS |
| Create a job order (8-field `StepForm` wizard, 3 steps) | PASS — toast "Job order JO-2026-NNN created" |
| Edit the job order (status Pending -> On Hold) | PASS — toast "Job order JO-2026-NNN updated" (after the migration fix above; failed before it) |
| Soft delete | PASS — toast "Job order JO-2026-NNN deleted" |
| Undo | PASS — toast "Job order JO-2026-NNN restored"; row confirmed back in the filtered list |
| Job detail page: status history shows "Pending -> On Hold" | PASS |
| Job detail page: Quoted Price field renders (staff) | PASS |

**Worker (`worker` / seeded password from `SMOKE_WORKER_PASSWORD`):**

| Check | Result |
| --- | --- |
| Login via `/login` | PASS |
| `/jobs` renders all jobs, read-all (not scoped to the worker's own jobs) | PASS (6+ rows across pagination) |
| No `quoted_price` data field anywhere in `/jobs`'s HTML | PASS |
| Edit action opens the status-only form (no Project Name field present) | PASS |
| Status-only restriction stated in plain words | PASS |
| Job detail page hides the quoted-price *data* (checked for the `quoted_price` field name and a currency-formatted value, not the UI label "Quoted Price" — that label ships to every role inside next-intl's client message catalog regardless of whether it is ever rendered, so matching it would be a false positive) | PASS |
| Job detail page still shows status history (read access to all jobs includes their history) | PASS |
| No `quoted_price` value observed in any network response (including Supabase REST calls) | PASS |

Final run: **16/16 checks passed.**

Also verified manually in the same session: the worker's Edit action on
a job **assigned to them** (not completed) lets them change status and
shows no restriction banner; the same action on a job **not assigned to
them** shows the disabled control with the "only the shop owner or admin
staff can change this" explanation, matching Requirement 9 (error
prevention — never silently inert).

### Test-data cleanup

All job orders created by the smoke test (`project_name = "Smoke Test
Cabinet"`) were soft-deleted after the run so the seeded, graded dataset
is unaffected:

```sql
update jobs set deleted_at = now()
where project_name = 'Smoke Test Cabinet' and deleted_at is null;
-- confirmed 0 remaining active rows afterward
```

This is the same effect the UI's own Delete action produces (soft
delete, not a hard delete) — no destructive SQL was run.

## 5. RLS / permission spot checks (observed through the smoke test, not re-derived)

| Role | Action | Result |
| --- | --- | --- |
| `worker` | `select * from jobs` (via `/jobs`) | all rows readable, confirming `jobs_select_all` (Requirement 3.4) |
| `worker` | edit a job assigned to them | status change succeeds via `update_job_status` |
| `worker` | edit a job not assigned to them | blocked client-side with a named reason; the same call would be refused server-side by `JOB_NOT_ASSIGNED` |
| `owner` | create/edit/delete/restore a job order | all succeed via `create_job_order`/`update_job_order`/the `jobs_update_staff` grant |

## 6. Git log of new commits (this phase, on `master`, not pushed)

```
d965ad5 feat(jobs): add job order detail view, status history and materials issued
d528d5e feat(jobs): add Job Orders list and create/edit form
38d947c feat(customers): add Customers list, create/edit dialog, soft delete+Undo
69082da fix: qualify ambiguous column references in update_job_order()
```

Plus the closing docs commit for task 3.6 (this file, `docs/design-rationale.md`,
`docs/evaluation-traceability.md`, `tasks.md`'s checkboxes), committed
immediately after this note.

## 7. Secrets check

```
git grep -n -i "RjmOwner|RjmAdmin|RjmWorker|sb_secret|SUPABASE_SECRET_KEY=" -- src docs messages .kiro supabase .agents
-> no matches
```

No demo password and no secret key appear in any file touched this
phase. The smoke test read both demo passwords from environment
variables (`SMOKE_OWNER_PASSWORD`, `SMOKE_WORKER_PASSWORD`) set inline in
the shell for that one run, never written to disk.

## 8. Not completed / deferred

Nothing from 3.1-3.6 was skipped. Two deliberate scope choices, both
within the brief's "do not over-engineer" steering and recorded in
`docs/design-rationale.md`:

- The customer picker on the job form is a plain `Select`, not a
  searchable combobox — the shop's customer count does not justify the
  extra UI for a four-day build.
- The job detail page's status history shows the `from -> to` transition
  and its timestamp, not who made the change (`changed_by` is not joined
  to a profile name) — design §13.4 calls this "where available," and a
  one-off join for a panel that is rarely more than one or two rows deep
  was not judged worth it on this clock.

Dev server stopped; no process left running. All throwaway smoke-test
scripts and logs deleted; `git status` shows no stray files.
