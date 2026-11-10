-- supabase/migrations/0012_job_tasks.sql  [STRETCH — schema only, no UI in v0.1]
-- Purpose: reserve the data model for a future per-job task checklist
-- (settled decision D3). No application code reads this table yet.
-- Roles: everyone reads; owner/admin create and edit; the assignee may move
-- their own task along. Unlike `jobs`, this table carries no generated code,
-- so an ordinary insert policy is enough — there is no code to protect.

begin;

-- 1. objects ------------------------------------------------------------
create table public.job_tasks (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  status      text not null default 'pending'
              check (status in ('pending','in_progress','completed')),
  due_date    date,
  created_at  timestamptz not null default now()
);
create index job_tasks_job_idx on public.job_tasks (job_id);

-- 2. RLS on, always -------------------------------------------------------
alter table public.job_tasks enable row level security;

-- 3. explicit grants ------------------------------------------------------
grant select, insert, update on public.job_tasks to authenticated; -- no DELETE
grant all on public.job_tasks to service_role;

-- 4. + 5. policies ----------------------------------------------------------
-- Everyone reads a job's task list.
create policy job_tasks_select_all on public.job_tasks
  for select to authenticated using (true);

-- Only owner/admin create tasks.
create policy job_tasks_insert_staff on public.job_tasks
  for insert to authenticated with check (public.is_staff());

-- Owner/admin may edit any task.
create policy job_tasks_update_staff on public.job_tasks
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- The assignee may move their own task along (e.g. mark it in progress or
-- completed) without needing staff privileges.
create policy job_tasks_update_assignee on public.job_tasks
  for update to authenticated using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select count(*) from job_tasks;                 -- any role: ok (0 rows, no seed, no UI)
-- insert into job_tasks (job_id, title) values ('<a job id>', 'Smoke test');
--   -- worker: ERROR, policy violation ; owner/admin: ok
-- anon key: select count(*) from job_tasks;        -- ERROR, permission denied for table
