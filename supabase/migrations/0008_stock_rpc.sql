-- supabase/migrations/0008_stock_rpc.sql
-- Purpose: record_stock_movement() — the one and only writer of
-- inventory_transactions, inventory_transaction_costs and
-- materials.current_stock (design §12).
-- Roles: stock_out is allowed for every signed-in role (limited to the
-- worker's own assigned, not-yet-completed job); stock_in and adjustment
-- require owner/admin. `security definer` because the calling user has no
-- privilege on any of the three tables it writes — the function re-checks
-- the caller's role itself rather than trusting RLS.

begin;

create or replace function public.record_stock_movement(
  p_material_id uuid,
  p_type        text,
  p_quantity    numeric,
  p_reason      text    default null,
  p_job_id      uuid    default null,
  p_direction   smallint default null
) returns table (
  transaction_id uuid, txn_code text, new_stock numeric, material_name text, unit text
) language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid         uuid;
  v_role        text;
  v_material    record;
  v_job         record;
  v_delta       numeric(14,4);
  v_reason      text;
  v_txn_id      uuid;
  v_txn_code    text;
begin
  -- 1-2. who is calling
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;
  v_role := public.current_app_role();
  if v_role is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  -- 3. authorise by type
  if p_type in ('stock_in', 'adjustment') and not public.is_staff() then
    raise exception 'NOT_PERMITTED' using errcode = 'P0001';
  end if;

  -- 4. validate input
  if p_type not in ('stock_in', 'stock_out', 'adjustment') then
    raise exception 'INVALID_TYPE' using errcode = 'P0001';
  end if;
  if p_quantity is null or p_quantity <= 0 or scale(p_quantity) > 4 then
    raise exception 'INVALID_QUANTITY' using errcode = 'P0001';
  end if;
  v_reason := btrim(coalesce(p_reason, ''));
  if p_type in ('stock_in', 'adjustment') and v_reason = '' then
    raise exception 'REASON_REQUIRED' using errcode = 'P0001';
  end if;
  v_reason := case when v_reason = '' then null else left(v_reason, 300) end;
  if p_type = 'adjustment' and p_direction not in (1, -1) then
    raise exception 'INVALID_DIRECTION' using errcode = 'P0001';
  end if;

  -- 5. lock the material row
  select id, name, unit, current_stock into v_material
  from public.materials
  where id = p_material_id and deleted_at is null
  for update;
  if v_material.id is null then
    raise exception 'MATERIAL_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 6. validate the job order
  if v_role = 'worker' and p_type = 'stock_out' and p_job_id is null then
    raise exception 'JOB_REQUIRED' using errcode = 'P0001';
  end if;
  if p_job_id is not null then
    select id, assigned_to, status into v_job
    from public.jobs
    where id = p_job_id and deleted_at is null;
    if v_job.id is null then
      raise exception 'JOB_NOT_FOUND' using errcode = 'P0001';
    end if;
    if v_role = 'worker' then
      if v_job.assigned_to is distinct from v_uid then
        raise exception 'JOB_NOT_ASSIGNED' using errcode = 'P0001';
      end if;
      if v_job.status = 'completed' then
        raise exception 'JOB_COMPLETED' using errcode = 'P0001';
      end if;
    end if;
  end if;

  -- 7. compute and guard the new figure
  v_delta := case p_type
    when 'stock_in'  then p_quantity
    when 'stock_out' then -p_quantity
    else p_direction * p_quantity
  end;
  if p_type = 'stock_out' then
    if v_material.current_stock = 0 then
      raise exception 'OUT_OF_STOCK' using errcode = 'P0001',
        detail = json_build_object('material', v_material.name, 'unit', v_material.unit)::text;
    end if;
    if v_material.current_stock + v_delta < 0 then
      raise exception 'INSUFFICIENT_STOCK' using errcode = 'P0001',
        detail = json_build_object(
          'available', v_material.current_stock, 'requested', p_quantity,
          'unit', v_material.unit, 'material', v_material.name)::text;
    end if;
  end if;

  -- 8. write the ledger row
  v_txn_code := public.next_transaction_code();
  insert into public.inventory_transactions
    (txn_code, material_id, type, quantity, delta, reason, job_id, created_by)
  values (v_txn_code, p_material_id, p_type, p_quantity, v_delta, v_reason, p_job_id, v_uid)
  returning id into v_txn_id;

  -- 9. write the cost row (select form: a legacy row with no material_costs
  -- row simply gets none here, rather than blocking the stock-out)
  insert into public.inventory_transaction_costs (transaction_id, unit_cost_at_time)
  select v_txn_id, mc.unit_cost from public.material_costs mc
  where mc.material_id = p_material_id;

  -- 10. update the stock, with the trigger flag open for exactly one statement
  set local app.stock_rpc = 'on';
  update public.materials
  set current_stock = current_stock + v_delta, updated_at = now()
  where id = p_material_id;
  set local app.stock_rpc = 'off';

  -- 11. return the new figure
  return query
    select v_txn_id, v_txn_code,
           (v_material.current_stock + v_delta), v_material.name, v_material.unit;
end $$;

-- 3. explicit grants --------------------------------------------------------
revoke execute on function public.record_stock_movement(uuid, text, numeric, text, uuid, smallint)
  from public, anon;
grant execute on function public.record_stock_movement(uuid, text, numeric, text, uuid, smallint)
  to authenticated, service_role;

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select * from record_stock_movement('<a material id>', 'stock_out', 1, null, '<an assigned job id>');
--   -- worker: ok if assigned and job not completed; the material's current_stock drops by 1
-- select * from record_stock_movement('<a material id>', 'stock_in', 1, 'Supplier delivery');
--   -- worker: ERROR, NOT_PERMITTED ; owner/admin: ok
-- anon key: select * from record_stock_movement('<a material id>', 'stock_out', 1);
--   -- ERROR, permission denied for function
