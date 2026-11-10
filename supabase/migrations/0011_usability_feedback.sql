-- supabase/migrations/0011_usability_feedback.sql
-- Purpose: the in-app usability feedback table the "+ Add observation"
-- dialog writes to (design §20, indicators 19 & 22).
-- Roles: anyone signed in may record an observation, only as themselves;
-- the owner and admin staff may read every entry (they review and export
-- it); a worker can only read their own.

begin;

-- 1. objects ------------------------------------------------------------
create table public.usability_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  page       text not null check (char_length(page) <= 120),
  rating     smallint not null check (rating between 1 and 5),
  note       text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index usability_feedback_created_idx on public.usability_feedback (created_at desc);

-- 2. RLS on, always -------------------------------------------------------
alter table public.usability_feedback enable row level security;

-- 3. explicit grants ------------------------------------------------------
grant select, insert on public.usability_feedback to authenticated;
-- No update, no delete: research data is not editable after the fact.
grant all on public.usability_feedback to service_role;

-- 4. + 5. policies ----------------------------------------------------------
-- Anyone signed in may record an observation, and only as themselves — you
-- cannot file feedback under someone else's name.
create policy feedback_insert_self on public.usability_feedback
  for insert to authenticated with check (user_id = auth.uid());

-- You can read back your own observations; the owner and admin staff can
-- read all of them, because they are the ones who review and export the
-- research data.
create policy feedback_select_own_or_staff on public.usability_feedback
  for select to authenticated using (user_id = auth.uid() or public.is_staff());

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- insert into usability_feedback (user_id, page, rating, note)
--   values (auth.uid(), '/dashboard', 5, 'Smoke test');   -- any role: ok
-- insert into usability_feedback (user_id, page, rating)
--   values ('<someone else''s id>', '/dashboard', 5);      -- any role: ERROR, policy violation
-- select count(*) from usability_feedback;                 -- worker: only their own rows;
--                                                           -- owner/admin: every row
-- anon key: select count(*) from usability_feedback;        -- ERROR, permission denied for table
