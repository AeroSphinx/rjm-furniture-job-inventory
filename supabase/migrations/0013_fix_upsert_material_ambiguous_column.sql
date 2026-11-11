-- supabase/migrations/0013_fix_upsert_material_ambiguous_column.sql
-- Purpose: fix a bug found live while building Phase 4 (task 4.2): every
-- call to upsert_material() — the only creation/edit path for a material
-- (design §13.3) — failed with "column reference 'material_code' is
-- ambiguous". The function's own RETURNS TABLE declares OUT parameters
-- named material_code and current_stock, which collide with the
-- identically-named columns on materials in the final, unqualified
-- `select material_code, current_stock into ... from materials` — the
-- same class of bug design §13.1 already names and fixes once for
-- update_job_order() ("qualifying the colliding references with a table
-- alias"), just not carried over to this sibling function. No behaviour
-- changes: the fix only adds the table alias.
-- Roles: unchanged — same grants as migration 0009.

begin;

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

  -- Fix: qualified with the `m` alias — material_code and current_stock
  -- are also this function's own OUT parameter names (see above).
  select m.material_code, m.current_stock into v_code, v_stock
  from public.materials m where m.id = v_id;

  return query select v_id, v_code, v_stock;
end $$;

-- grants unchanged from migration 0009 — restated so this migration is
-- re-runnable on its own and does not rely on 0009 having left them intact.
revoke execute on function public.upsert_material(text, text, text, numeric, uuid, numeric, numeric)
  from public, anon;
grant execute on function public.upsert_material(text, text, text, numeric, uuid, numeric, numeric)
  to authenticated, service_role;

commit;

-- 7. smoke test (paste into the SQL editor while signed in as owner/admin)
-- select * from upsert_material('Smoke Test', 'Plywood', 'sheets', 5, null, 100, 0);
--   -- expect a material_id, a MAT-NNN code and current_stock = 0, not an ambiguous-column error
