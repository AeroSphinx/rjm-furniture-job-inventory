-- supabase/migrations/0001_helpers.sql
-- Purpose: the two role-reading helpers every later policy calls, plus the
-- shared `updated_at` trigger function.
-- Roles: nobody calls these directly from the browser; they only run inside
-- other policies and triggers (security definer, so they do not recurse
-- into the policies on `profiles`).

begin;

-- 1. objects --------------------------------------------------------------
-- `language plpgsql`, not `sql`: a LANGUAGE SQL function is parse-analysed
-- (including resolving every table it touches) at CREATE time, because
-- Postgres must confirm the last query's result type matches RETURNS —
-- and `profiles` does not exist until migration 0002. plpgsql bodies are
-- opaque text checked lazily at first call, so the migration order from
-- design §9 (helpers before profiles) can stand without a forward-reference
-- error. Behaviour is identical either way.
create or replace function public.current_app_role()
returns text language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  return (select p.role from public.profiles p where p.id = auth.uid());
end $$;
-- SECURITY DEFINER on purpose: the policies on `profiles` itself call this
-- function, and an invoker-rights function would recurse into those policies.

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.current_app_role() in ('owner','admin_staff')
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;

-- 2. RLS on: none of these are tables, so there is nothing to enable here.

-- 3. explicit grants --------------------------------------------------------
-- `current_app_role` and `is_staff` are read by policies on every table, so
-- every signed-in user must be able to call them; `touch_updated_at` is a
-- trigger function and is never called directly, so it gets no grant at all
-- (a trigger function needs no EXECUTE grant to fire).
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_staff()           to authenticated;
revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.is_staff()           from public, anon;
grant execute on function public.current_app_role(), public.is_staff() to service_role;

-- 4. + 5. policies: none — these are functions, not tables.

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select public.current_app_role();     -- any signed-in user: their own role text
-- select public.is_staff();              -- owner/admin: true ; worker: false
-- select public.current_app_role();      -- anon key: ERROR, permission denied for function
