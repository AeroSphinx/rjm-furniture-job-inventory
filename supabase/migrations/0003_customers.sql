-- supabase/migrations/0003_customers.sql
-- Purpose: customer contact details that job orders reference.
-- Roles: everyone signed in can read customers (a carpenter looking at a job
-- order has to see whose dining set it is); only the owner and admin staff
-- add, edit or soft-delete one. No money column, no generated code, so no
-- write function is needed — plain grants and policies are the right tool.

begin;

-- 1. objects ------------------------------------------------------------
create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 120),
  phone      text check (phone is null or char_length(phone) <= 20),
  address    text check (address is null or char_length(address) <= 300),
  notes      text check (notes is null or char_length(notes) <= 1000),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index customers_active_name_idx on public.customers (lower(name))
  where deleted_at is null;

create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

-- 2. RLS on, always -------------------------------------------------------
alter table public.customers enable row level security;

-- 3. explicit grants ------------------------------------------------------
-- All columns, because customers carry no generated code and no money column
-- — there is nothing a write function would be protecting here (design §10).
grant select, insert, update on public.customers to authenticated;
grant all on public.customers to service_role;
-- No DELETE: a customer is only ever soft-deleted, so past jobs stay visible.

-- 4. + 5. policies ----------------------------------------------------------
-- Everyone signed in can read customers.
create policy customers_select_all on public.customers
  for select to authenticated using (true);

-- Only the owner and admin staff add customers.
create policy customers_insert_staff on public.customers
  for insert to authenticated with check (public.is_staff());

-- Only the owner and admin staff edit or soft-delete (set deleted_at) a
-- customer. Two policies because a Postgres policy names one command; there
-- is no delete policy, so a customer can only ever be soft-deleted.
create policy customers_update_staff on public.customers
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select count(*) from customers;                  -- worker: > 0 (read allowed)
-- insert into customers (name) values ('Smoke Test');  -- worker: ERROR, no privilege
-- insert into customers (name) values ('Smoke Test');  -- owner/admin: ok
-- anon key: select count(*) from customers;         -- ERROR, permission denied for table customers
