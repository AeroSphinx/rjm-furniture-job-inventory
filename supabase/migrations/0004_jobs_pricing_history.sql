-- supabase/migrations/0004_jobs_pricing_history.sql
-- Purpose: job orders, the staff-only quoted price in its own table (§7.1,
-- §8), and the status-change history every status edit writes to.
-- Roles: everyone signed in reads every job order (the settled "slightly
-- wider" worker permission — jobs get reassigned and shared on the floor);
-- only owner/admin soft-delete, restore or field-edit a job (through
-- `create_job_order`/`update_job_order`, migration 0009); a worker may
-- change only the `status` of a job assigned to them, and only while it is
-- not yet completed; only owner/admin ever read or write `job_pricing`.

begin;

-- 1. objects ------------------------------------------------------------
create table public.jobs (
  id                  uuid primary key default gen_random_uuid(),
  job_code            text not null unique,                      -- JO-YYYY-NNN
  customer_id         uuid not null references public.customers(id) on delete restrict,
  project_name        text not null check (char_length(project_name) between 2 and 120),
  description         text check (description is null or char_length(description) <= 2000),
  order_date          date not null,
  expected_completion date,
  assigned_to         uuid references public.profiles(id) on delete set null,
  status              text not null default 'pending'
                      check (status in ('pending','in_progress','on_hold','completed')),
  status_changed_at   timestamptz not null default now(),  -- written only by
                                                            -- jobs_set_status_changed_at
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  constraint jobs_dates_ordered
    check (expected_completion is null or expected_completion >= order_date)
);
create index jobs_list_idx     on public.jobs (order_date desc) where deleted_at is null;
create index jobs_status_idx   on public.jobs (status)          where deleted_at is null;
create index jobs_assigned_idx on public.jobs (assigned_to)     where deleted_at is null;

create table public.job_pricing (                       -- money, owner + admin only
  job_id       uuid primary key references public.jobs(id) on delete cascade,
  quoted_price numeric(12,2) not null check (quoted_price >= 0 and quoted_price <= 9999999.99),
  updated_by   uuid references public.profiles(id) on delete set null,
  updated_at   timestamptz not null default now()
);

create table public.job_status_history (                -- feeds Requirement 9.12
  id          bigserial primary key,
  job_id      uuid not null references public.jobs(id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  changed_at  timestamptz not null default now()
);
create index job_status_history_job_idx on public.job_status_history (job_id, changed_at desc);

-- Triggers, named so they fire in this order on `before update`:
-- jobs_guard_worker_update -> jobs_set_status_changed_at -> jobs_touch_updated_at
-- (Postgres fires same-timing triggers in name order). The guard runs first
-- so a worker's forbidden write is rejected before anything else is stamped.

create or replace function public.jobs_guard_worker_update() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if public.current_app_role() = 'worker' and (
       new.job_code is distinct from old.job_code or
       new.customer_id is distinct from old.customer_id or
       new.project_name is distinct from old.project_name or
       new.description is distinct from old.description or
       new.order_date is distinct from old.order_date or
       new.expected_completion is distinct from old.expected_completion or
       new.assigned_to is distinct from old.assigned_to or
       new.created_by is distinct from old.created_by or
       new.created_at is distinct from old.created_at or
       new.deleted_at is distinct from old.deleted_at
     ) then
    raise exception 'WORKER_STATUS_ONLY' using errcode = 'P0001';
  end if;
  return new;
end $$;

create or replace function public.jobs_set_status_changed_at() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at := now();
  end if;
  return new;
end $$;

-- `security definer`: `job_status_history` has no client insert grant, so
-- running as the table owner is what makes this trigger its only possible
-- writer on every path, including a direct PATCH of jobs.status.
create or replace function public.jobs_log_status_change() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.status is distinct from old.status then
    insert into public.job_status_history (job_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;

create trigger jobs_guard_worker_update before update on public.jobs
  for each row execute function public.jobs_guard_worker_update();
create trigger jobs_set_status_changed_at before update on public.jobs
  for each row execute function public.jobs_set_status_changed_at();
create trigger jobs_touch_updated_at before update on public.jobs
  for each row execute function public.touch_updated_at();
create trigger jobs_log_status_change after update on public.jobs
  for each row execute function public.jobs_log_status_change();

create trigger job_pricing_touch before update on public.job_pricing
  for each row execute function public.touch_updated_at();

-- 2. RLS on, always -------------------------------------------------------
alter table public.jobs               enable row level security;
alter table public.job_pricing         enable row level security;
alter table public.job_status_history  enable row level security;

-- 3. explicit grants ------------------------------------------------------
grant select on public.jobs to authenticated;
grant update (status, deleted_at, updated_at) on public.jobs to authenticated;
-- No INSERT: a job is created only by create_job_order() (migration 0009),
-- which mints job_code in the same transaction. No DELETE: soft delete only.
-- status_changed_at is deliberately absent — jobs_set_status_changed_at owns it.

grant select, insert, update on public.job_pricing to authenticated; -- no DELETE (§8.1)

grant select on public.job_status_history to authenticated;
-- No INSERT: the trigger (security definer) is the only writer.

grant all on public.jobs, public.job_pricing, public.job_status_history to service_role;

-- 4. + 5. policies, each with its plain-English note -------------------------
-- Everyone signed in can read every job order — jobs get reassigned and
-- shared on the floor, so hiding other people's jobs would hurt more than
-- it helps. No money column exists on this table.
create policy jobs_select_all on public.jobs
  for select to authenticated using (true);

-- The owner and admin staff may soft-delete/restore a job order and change
-- its status. The column grant above limits every client to status,
-- deleted_at and updated_at; everything else goes through update_job_order().
create policy jobs_update_staff on public.jobs
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- A carpenter may update only a job assigned to them, and only while it is
-- not finished. The row filter is here; the column restriction (nothing but
-- status/status_changed_at/updated_at) is enforced by jobs_guard_worker_update,
-- because RLS alone cannot say "only this column".
create policy jobs_update_assigned_worker on public.jobs
  for update to authenticated
  using (public.current_app_role() = 'worker' and assigned_to = auth.uid() and status <> 'completed')
  with check (assigned_to = auth.uid());

-- The quoted price is money: only owner/admin may read, add or change it.
-- A carpenter has no policy here at all, so the table returns zero rows.
-- Three policies, not one `for all`, because `all` quietly includes DELETE
-- and nothing in this app should ever delete a price row from the browser
-- — clearing a price happens inside update_job_order() (migration 0009).
create policy job_pricing_select_staff on public.job_pricing
  for select to authenticated using (public.is_staff());
create policy job_pricing_insert_staff on public.job_pricing
  for insert to authenticated with check (public.is_staff());
create policy job_pricing_update_staff on public.job_pricing
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Everyone can read the status history of a job; it is the shop's record of
-- progress. There is no insert policy because there is no insert grant.
create policy job_history_select_all on public.job_status_history
  for select to authenticated using (true);

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select count(*) from jobs;                 -- worker: > 0
-- select count(*) from job_pricing;          -- worker: 0 ; owner: > 0
-- update jobs set project_name = 'x' where id = '<some id>';   -- everyone: ERROR, no
--                                            -- privilege on that column
-- insert into jobs (job_code, customer_id, project_name, order_date)
--   values ('JO-HAND-1', '<a customer id>', 'x', current_date);  -- everyone incl.
--                                            -- owner: ERROR, no privilege
-- anon key: select count(*) from jobs;        -- ERROR, permission denied for table jobs
