-- supabase/migrations/0002_profiles.sql
-- Purpose: one row per auth user — username, role, email (for login
-- resolution) and jsonb preferences — plus the trigger that stops anyone
-- from promoting or deactivating themselves.
-- Roles: everyone signed in can read the staff list's non-secret columns;
-- you may edit your own display name and preferences; only the owner may
-- change someone's role, username, email or deactivated_at.

begin;

-- 1. objects ----------------------------------------------------------------
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null check (char_length(full_name) between 2 and 120),
  username       text not null check (username ~ '^[a-z0-9._-]{3,30}$'),
  email          text not null,
  role           text not null check (role in ('owner','admin_staff','worker')),
  preferences    jsonb not null default '{}'::jsonb,
  deactivated_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index profiles_username_key on public.profiles (lower(username));
create unique index profiles_email_key    on public.profiles (lower(email));

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- `profiles_guard_self_edit` — see design §13.4 for the full reasoning.
create or replace function public.profiles_guard_self_edit() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_is_server boolean;
begin
  -- The secret key arrives at Postgres as the `service_role` database role
  -- (the seed script and the admin API route both use it), where auth.uid()
  -- is null — current_app_role() would be null and every check below would
  -- fail closed for a write the application has already authorised.
  v_is_server :=
    current_user in ('service_role', 'postgres', 'supabase_admin')
    or coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role';
  if v_is_server then
    return new;
  end if;

  -- Nobody may change their own role, username, email or deactivated_at.
  if auth.uid() = old.id and (
       new.role is distinct from old.role or
       new.username is distinct from old.username or
       new.email is distinct from old.email or
       new.deactivated_at is distinct from old.deactivated_at
     ) then
    raise exception 'SELF_ROLE_CHANGE' using errcode = 'P0001';
  end if;

  -- Only an owner may change those four columns on someone else's row.
  if auth.uid() <> old.id and (
       new.role is distinct from old.role or
       new.username is distinct from old.username or
       new.email is distinct from old.email or
       new.deactivated_at is distinct from old.deactivated_at
     ) and public.current_app_role() <> 'owner' then
    raise exception 'NOT_PERMITTED' using errcode = 'P0001';
  end if;

  -- An owner may not demote or deactivate themselves — the shop always
  -- keeps one owner.
  if auth.uid() = old.id and old.role = 'owner' and (
       new.role is distinct from 'owner' or new.deactivated_at is not null
     ) then
    raise exception 'LAST_OWNER' using errcode = 'P0001';
  end if;

  -- Preferences must stay a plain jsonb object; unknown keys are dropped
  -- rather than rejected, so a future preference key does not have to be
  -- added here before it can be saved.
  if new.preferences is not null and jsonb_typeof(new.preferences) <> 'object' then
    raise exception 'INVALID_PREFERENCES' using errcode = 'P0001';
  end if;

  return new;
end $$;

create trigger profiles_guard_self_edit before update on public.profiles
  for each row execute function public.profiles_guard_self_edit();

-- 2. RLS on, always ----------------------------------------------------------
alter table public.profiles enable row level security;

-- 3. explicit grants ("auto expose new tables" is OFF) -----------------------
-- Column-scoped on purpose (§8.2): the same rule applies to every signed-in
-- user, so a column grant is the right tool. `email` is unreachable from any
-- client — it is a login-resolution identifier, not public staff data.
grant select (id, full_name, username, role, preferences, created_at, deactivated_at)
  on public.profiles to authenticated;
-- `preferences` is readable (not just writable) by any signed-in user: a
-- user's own accessibility/display settings have to survive signing in on
-- a brand-new device with no cookie yet (Requirement 15.8), and the value
-- carries no money, no login identifier, nothing §8 was written to guard.
grant update (full_name, preferences, updated_at)
  on public.profiles to authenticated;                    -- self-edit path
grant update (role, username, email, deactivated_at, updated_at)
  on public.profiles to authenticated;                    -- owner path; still
                                                            -- checked by the
                                                            -- policy + trigger
grant all on public.profiles to service_role;
-- No INSERT, no DELETE: accounts are created and removed only through the
-- Admin API (api/admin/users), never from the browser.

-- 4. + 5. policies, each with its plain-English note -------------------------
-- Anyone signed in can read the staff list's non-secret columns — the "Assigned
-- Worker" dropdown, "created by" labels and the user menu all need names.
create policy profiles_select_all on public.profiles
  for select to authenticated using (true);

-- You may edit your own row. The trigger above is what actually stops you
-- from touching role/username/email/deactivated_at through this policy.
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Only the shop owner may edit someone else's row (role changes, username
-- changes, deactivation). The trigger still enforces "not yourself" and
-- "not the last owner".
create policy profiles_update_owner on public.profiles
  for update to authenticated using (public.current_app_role() = 'owner')
  with check (public.current_app_role() = 'owner');

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select username, role from profiles;             -- worker: sees every row's
--                                                   -- allowed columns, 0 email column
-- select email from profiles;                       -- everyone: ERROR, permission
--                                                   -- denied for column email
-- update profiles set full_name = full_name where id = auth.uid();   -- self: ok
-- update profiles set role = 'owner' where id = auth.uid();          -- self: ERROR
--                                                   -- (SELF_ROLE_CHANGE), worker/admin only
-- anon key: select * from profiles;                 -- ERROR, permission denied for table profiles
