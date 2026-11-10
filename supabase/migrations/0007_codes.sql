-- supabase/migrations/0007_codes.sql
-- Purpose: the three code generators (JO-YYYY-NNN, MAT-NNN, TXN-NNNN) and
-- the per-year counter table JO-YYYY-NNN needs.
-- Roles: nobody — these are called only from inside other `security
-- definer` functions (create_job_order, upsert_material,
-- record_stock_movement), which run as their owner and need no caller
-- privilege at all.

begin;

-- 1. objects ------------------------------------------------------------
create sequence public.material_code_seq    as integer start 1    owned by none;
create sequence public.transaction_code_seq as integer start 1000 owned by none;

create table public.job_code_counters (
  year     integer primary key,
  last_seq integer not null default 0
);
-- no grants to `authenticated`: only next_job_code() below ever touches it.

create or replace function public.next_material_code()
returns text language sql security definer set search_path = public, pg_temp as $$
  select 'MAT-' || lpad(nextval('public.material_code_seq')::text, 3, '0')
$$;

create or replace function public.next_transaction_code()
returns text language sql security definer set search_path = public, pg_temp as $$
  select 'TXN-' || lpad(nextval('public.transaction_code_seq')::text, 4, '0')
$$;

-- JO-YYYY-NNN restarts at 001 every January (Asia/Manila year). A single
-- `insert ... on conflict do update ... returning` statement takes a row
-- lock on that year's counter row for its duration, so two concurrent job
-- creations are serialised and get consecutive numbers (design §11.3).
create or replace function public.next_job_code()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_year integer := extract(year from (now() at time zone 'Asia/Manila'))::int;
  v_seq  integer;
begin
  insert into public.job_code_counters (year, last_seq)
  values (v_year, 1)
  on conflict (year) do update
    set last_seq = job_code_counters.last_seq + 1   -- bare table name: required
                                                      -- inside ON CONFLICT DO UPDATE
  returning last_seq into v_seq;

  return 'JO-' || v_year::text || '-' || lpad(v_seq::text, 3, '0');
end $$;

-- 2. RLS on: none of these are tables with policy-bearing data except
-- job_code_counters, which carries no grant to `authenticated` at all —
-- RLS is not needed when there is no privilege to filter.

-- 3. explicit grants -------------------------------------------------------
-- Deliberately absent from the `authenticated` grant list (§10, §11.3):
-- these three are called only from inside other security definer functions.
-- `CREATE FUNCTION` grants EXECUTE to PUBLIC by default, so the revoke below
-- is required, not optional, to make that true.
revoke execute on function
  public.next_job_code(), public.next_material_code(), public.next_transaction_code()
  from public, anon, authenticated;
grant  execute on function
  public.next_job_code(), public.next_material_code(), public.next_transaction_code()
  to service_role;                      -- the seed script's own code arithmetic, nothing else

grant all on public.job_code_counters to service_role;
grant usage, select on sequence public.material_code_seq, public.transaction_code_seq
  to service_role;

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select next_job_code();        -- any signed-in role: ERROR, permission denied for function
-- select next_material_code();   -- any signed-in role: ERROR, permission denied for function
-- anon key: select next_job_code();  -- ERROR, permission denied for function
