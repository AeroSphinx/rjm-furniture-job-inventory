-- supabase/migrations/0009_job_material_rpcs.sql
-- Purpose: the only write paths for job orders and materials, so a code
-- and the row that uses it are always minted in one transaction (design
-- §13.1-§13.3).
-- Roles: create_job_order, update_job_order and upsert_material require
-- owner/admin (is_staff()); update_job_status is callable by anyone, but a
-- worker is limited to a job assigned to them and not yet completed.

begin;

-- 13.1 create_job_order -----------------------------------------------------
create or replace function public.create_job_order(
  p_customer_id uuid,
  p_project_name text,
  p_description text,
  p_order_date date,
  p_expected_completion date,
  p_assigned_to uuid,
  p_status text,
  p_quoted_price numeric default null
) returns table (job_id uuid, job_code text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_code    text;
  v_job_id  uuid;
  v_attempt int;
begin
  if not public.is_staff() then
    raise exception 'NOT_PERMITTED' using errcode = 'P0001';
  end if;

  if p_project_name is null or char_length(p_project_name) not between 2 and 120 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','project_name')::text;
  end if;
  if p_order_date is null then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','order_date')::text;
  end if;
  if p_expected_completion is not null and p_expected_completion < p_order_date then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','expected_completion')::text;
  end if;
  if p_status not in ('pending','in_progress','on_hold','completed') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id and deleted_at is null) then
    raise exception 'CUSTOMER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if p_assigned_to is not null and not exists (
    select 1 from public.profiles where id = p_assigned_to and deactivated_at is null
  ) then
    raise exception 'ASSIGNEE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Heal-then-retry: catching the exception rolls back the counter
  -- increment too, so a plain retry would mint the same code. The handler
  -- re-synchronises job_code_counters with the table — that update survives
  -- because it runs after the rollback (design §13.1).
  for v_attempt in 1..3 loop
    begin
      v_code := public.next_job_code();
      insert into public.jobs (job_code, customer_id, project_name, description,
                               order_date, expected_completion, assigned_to,
                               status, created_by)
      values (v_code, p_customer_id, p_project_name, p_description,
              p_order_date, p_expected_completion, p_assigned_to,
              p_status, auth.uid())
      returning id into v_job_id;
      exit;
    exception when unique_violation then
      update public.job_code_counters c
         set last_seq = greatest(c.last_seq, (
               select coalesce(max(split_part(j.job_code, '-', 3)::int), 0)
               from public.jobs j
               where j.job_code like 'JO-' || c.year || '-%'))
       where c.year = extract(year from (now() at time zone 'Asia/Manila'))::int;
      if v_attempt = 3 then
        raise exception 'CODE_GENERATION_FAILED' using errcode = 'P0001';
      end if;
    end;
  end loop;

  if p_quoted_price is not null then
    insert into public.job_pricing (job_id, quoted_price, updated_by)
    values (v_job_id, p_quoted_price, auth.uid());
  end if;

  return query select v_job_id, v_code;
end $$;

-- 13.1 update_job_order ------------------------------------------------------
create or replace function public.update_job_order(
  p_job_id uuid,
  p_customer_id uuid,
  p_project_name text,
  p_description text,
  p_order_date date,
  p_expected_completion date,
  p_assigned_to uuid,
  p_status text,
  p_quoted_price numeric default null,
  p_clear_price boolean default false
) returns table (job_id uuid, job_code text, old_status text, new_status text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_old record;
  v_code text;
begin
  if not public.is_staff() then
    raise exception 'NOT_PERMITTED' using errcode = 'P0001';
  end if;

  -- Columns are qualified with the table alias because this function's own
  -- `returns table (job_id, job_code, old_status, new_status)` declares
  -- output variables of those same names, and an unqualified reference is
  -- ambiguous between the two (the same bug class §13.4's design-rationale
  -- entry already names for `record_stock_movement()`'s `unit` column).
  select j.job_code, j.status into v_old from public.jobs j
  where j.id = p_job_id and j.deleted_at is null;
  if v_old.job_code is null then
    raise exception 'JOB_NOT_FOUND' using errcode = 'P0001';
  end if;
  v_code := v_old.job_code;

  if p_project_name is null or char_length(p_project_name) not between 2 and 120 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','project_name')::text;
  end if;
  if p_order_date is null then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','order_date')::text;
  end if;
  if p_expected_completion is not null and p_expected_completion < p_order_date then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','expected_completion')::text;
  end if;
  if p_status not in ('pending','in_progress','on_hold','completed') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.customers where id = p_customer_id and deleted_at is null) then
    raise exception 'CUSTOMER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if p_assigned_to is not null and not exists (
    select 1 from public.profiles where id = p_assigned_to and deactivated_at is null
  ) then
    raise exception 'ASSIGNEE_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.jobs set
    customer_id = p_customer_id,
    project_name = p_project_name,
    description = p_description,
    order_date = p_order_date,
    expected_completion = p_expected_completion,
    assigned_to = p_assigned_to,
    status = p_status
  where id = p_job_id;

  if p_clear_price then
    -- Qualified for the same reason as the `select` above: `job_id` is
    -- both a column on `job_pricing` and this function's own output
    -- parameter name.
    delete from public.job_pricing jp where jp.job_id = p_job_id;
  elsif p_quoted_price is not null then
    insert into public.job_pricing (job_id, quoted_price, updated_by)
    values (p_job_id, p_quoted_price, auth.uid())
    on conflict (job_id) do update
      set quoted_price = excluded.quoted_price, updated_by = excluded.updated_by, updated_at = now();
  end if;

  return query select p_job_id, v_code, v_old.status, p_status;
end $$;

-- 13.2 update_job_status — the carpenter's one write -------------------------
create or replace function public.update_job_status(p_job_id uuid, p_status text)
returns table (job_id uuid, old_status text, new_status text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_job record;
begin
  if p_status not in ('pending','in_progress','on_hold','completed') then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  select id, assigned_to, status into v_job from public.jobs
  where id = p_job_id and deleted_at is null;
  if v_job.id is null then
    raise exception 'JOB_NOT_FOUND' using errcode = 'P0001';
  end if;

  if public.current_app_role() = 'worker' then
    if v_job.assigned_to is distinct from auth.uid() then
      raise exception 'JOB_NOT_ASSIGNED' using errcode = 'P0001';
    end if;
    if v_job.status = 'completed' then
      raise exception 'JOB_COMPLETED' using errcode = 'P0001';
    end if;
  end if;

  update public.jobs set status = p_status where id = p_job_id;

  return query select p_job_id, v_job.status, p_status;
end $$;

-- 13.3 upsert_material --------------------------------------------------------
create or replace function public.upsert_material(
  p_name          text,
  p_category      text,
  p_unit          text,
  p_minimum_level numeric,
  p_material_id   uuid    default null,
  p_unit_cost     numeric default null,
  p_opening_stock numeric default 0
) returns table (material_id uuid, material_code text, current_stock numeric)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_id   uuid;
  v_code text;
  v_stock numeric(14,4);
begin
  if not public.is_staff() then
    raise exception 'NOT_PERMITTED' using errcode = 'P0001';
  end if;

  if p_name is null or char_length(p_name) not between 2 and 120 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','name')::text;
  end if;
  if p_category not in ('Lumber','Plywood','Fasteners','Adhesives','Finishing','Hardware','Consumables') then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','category')::text;
  end if;
  if p_unit not in ('board ft','sheets','kg','liters','boxes','pairs','pieces') then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','unit')::text;
  end if;
  if p_minimum_level is null or p_minimum_level < 0 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','minimum_level')::text;
  end if;
  -- Required even though the parameter keeps `default null` so the
  -- signature stays callable by name (design §13.3) — a material created
  -- without a cost would stamp unit_cost_at_time = null on every stock-out
  -- it ever has.
  if p_unit_cost is null or p_unit_cost < 0 then
    raise exception 'INVALID_INPUT' using errcode = 'P0001',
      detail = json_build_object('field','unit_cost')::text;
  end if;

  if p_material_id is null then
    begin
      v_code := public.next_material_code();
      insert into public.materials (material_code, name, category, unit, minimum_level, created_by)
      values (v_code, p_name, p_category, p_unit, p_minimum_level, auth.uid())
      returning id into v_id;
    exception when unique_violation then
      raise exception 'MATERIAL_NAME_TAKEN' using errcode = 'P0001';
    end;

    insert into public.material_costs (material_id, unit_cost, updated_by)
    values (v_id, p_unit_cost, auth.uid());

    if p_opening_stock is not null and p_opening_stock > 0 then
      perform public.record_stock_movement(
        p_material_id => v_id, p_type => 'adjustment', p_quantity => p_opening_stock,
        p_reason => 'Opening stock count', p_direction => 1);
    end if;
  else
    if not exists (select 1 from public.materials where id = p_material_id and deleted_at is null) then
      raise exception 'MATERIAL_NOT_FOUND' using errcode = 'P0001';
    end if;
    begin
      update public.materials
      set name = p_name, category = p_category, unit = p_unit, minimum_level = p_minimum_level
      where id = p_material_id;
    exception when unique_violation then
      raise exception 'MATERIAL_NAME_TAKEN' using errcode = 'P0001';
    end;

    insert into public.material_costs (material_id, unit_cost, updated_by)
    values (p_material_id, p_unit_cost, auth.uid())
    on conflict (material_id) do update
      set unit_cost = excluded.unit_cost, updated_by = excluded.updated_by, updated_at = now();

    v_id := p_material_id;
    -- p_opening_stock is ignored on update with no error (design §13.3):
    -- stock after creation moves only through a recorded transaction.
  end if;

  select material_code, current_stock into v_code, v_stock
  from public.materials where id = v_id;

  return query select v_id, v_code, v_stock;
end $$;

-- 3. explicit grants ----------------------------------------------------------
revoke execute on function public.create_job_order(uuid, text, text, date, date, uuid, text, numeric)
  from public, anon;
revoke execute on function public.update_job_order(uuid, uuid, text, text, date, date, uuid, text, numeric, boolean)
  from public, anon;
revoke execute on function public.update_job_status(uuid, text) from public, anon;
revoke execute on function public.upsert_material(text, text, text, numeric, uuid, numeric, numeric)
  from public, anon;

grant execute on function public.create_job_order(uuid, text, text, date, date, uuid, text, numeric)
  to authenticated, service_role;
grant execute on function public.update_job_order(uuid, uuid, text, text, date, date, uuid, text, numeric, boolean)
  to authenticated, service_role;
grant execute on function public.update_job_status(uuid, text) to authenticated, service_role;
grant execute on function public.upsert_material(text, text, text, numeric, uuid, numeric, numeric)
  to authenticated, service_role;

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select * from create_job_order('<a customer id>', 'Test Cabinet', null, current_date, null, null, 'pending');
--   -- worker: ERROR, NOT_PERMITTED ; owner/admin: ok, returns a fresh JO-<year>-NNN
-- select * from update_job_status('<a job id assigned to the worker>', 'in_progress');
--   -- worker: ok ; on a job NOT assigned to them: ERROR, JOB_NOT_ASSIGNED
-- select * from upsert_material('Smoke Test Wood','Lumber','board ft',5,null,10,0);
--   -- worker: ERROR, NOT_PERMITTED ; owner/admin: ok, returns a fresh MAT-NNN
-- anon key: select * from create_job_order(...);  -- ERROR, permission denied for function
