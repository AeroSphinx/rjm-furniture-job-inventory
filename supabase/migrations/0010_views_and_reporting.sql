-- supabase/migrations/0010_views_and_reporting.sql
-- Purpose: the three read views every list/alert/dashboard screen uses
-- (design §7.3) and the three read functions that aggregate across them
-- (design §13.6).
-- Roles: the three views carry no money column, so they are safe (and
-- readable) for every role; dashboard_summary() is the same; report_summary()
-- and job_material_cost() are staff-only, gated inside the function body.

begin;

-- 1. objects: views -----------------------------------------------------
create view public.v_material_status with (security_invoker = true) as
  select m.id, m.material_code, m.name, m.category, m.unit,
         m.current_stock, m.minimum_level, m.updated_at, m.deleted_at,
         case when m.current_stock = 0 then 'out_of_stock'
              when m.current_stock <= m.minimum_level then 'low_stock'
              else 'in_stock' end as stock_status,
         (m.minimum_level - m.current_stock) as shortfall
  from public.materials m
  where m.deleted_at is null;

create view public.v_jobs_list with (security_invoker = true) as
  select j.id, j.job_code, j.customer_id, j.project_name, j.description,
         j.order_date, j.expected_completion, j.assigned_to, j.status,
         j.status_changed_at, j.created_at, j.updated_at,
         c.name        as customer_name,
         p.full_name   as assigned_name
  from public.jobs j
  join public.customers c on c.id = j.customer_id
  left join public.profiles p on p.id = j.assigned_to
  where j.deleted_at is null;

create view public.v_transactions_list with (security_invoker = true) as
  select t.id, t.txn_code, t.material_id, t.type, t.quantity, t.delta,
         t.reason, t.job_id, t.created_by, t.created_at,
         m.name  as material_name,
         m.unit  as unit,
         j.job_code as job_code
  from public.inventory_transactions t
  join public.materials m on m.id = t.material_id
  left join public.jobs j on j.id = t.job_id;

-- A `security_invoker` view inherits the underlying tables' policies, not
-- their privileges, so each needs its own grant (§9 checklist box 3).
grant select on public.v_material_status, public.v_jobs_list, public.v_transactions_list
  to authenticated, service_role;

-- 1. objects: read functions ---------------------------------------------
create or replace function public.dashboard_summary()
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare
  v_jobs_total int; v_pending int; v_in_progress int; v_completed int; v_on_hold int;
  v_this_month int; v_due_week int; v_rate numeric;
  v_materials_total int; v_category_count int; v_low int; v_out int; v_txn_month int;
  v_recent_jobs jsonb; v_recent_txns jsonb;
begin
  select count(*), count(*) filter (where status = 'pending'),
         count(*) filter (where status = 'in_progress'),
         count(*) filter (where status = 'completed'),
         count(*) filter (where status = 'on_hold'),
         count(*) filter (where order_date >= date_trunc('month', current_date))
  into v_jobs_total, v_pending, v_in_progress, v_completed, v_on_hold, v_this_month
  from public.v_jobs_list;

  select count(*) into v_due_week from public.v_jobs_list
  where status = 'in_progress'
    and expected_completion between current_date and current_date + 7;

  v_rate := case when v_jobs_total = 0 then 0
                 else round(100.0 * v_completed / v_jobs_total) end;

  select count(*), count(distinct category) into v_materials_total, v_category_count
  from public.materials where deleted_at is null;

  select count(*) filter (where stock_status = 'low_stock'),
         count(*) filter (where stock_status = 'out_of_stock')
  into v_low, v_out
  from public.v_material_status;

  select count(*) into v_txn_month from public.inventory_transactions
  where created_at >= date_trunc('month', current_date);

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_recent_jobs from (
    select id, job_code, customer_name, project_name, expected_completion, status
    from public.v_jobs_list order by order_date desc limit 5
  ) t;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_recent_txns from (
    select id, txn_code, material_name, type, quantity, unit, job_code, created_at
    from public.v_transactions_list order by created_at desc limit 5
  ) t;

  return jsonb_build_object(
    'jobs_total', v_jobs_total, 'jobs_pending', v_pending,
    'jobs_in_progress', v_in_progress, 'jobs_completed', v_completed,
    'jobs_on_hold', v_on_hold, 'jobs_this_month', v_this_month,
    'due_this_week', v_due_week, 'completion_rate', v_rate,
    'materials_total', v_materials_total, 'category_count', v_category_count,
    'low_stock_count', v_low, 'out_of_stock_count', v_out,
    'txn_this_month', v_txn_month,
    'recent_jobs', v_recent_jobs, 'recent_transactions', v_recent_txns
  );
end $$;

create or replace function public.report_summary(p_from date, p_to date)
returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare
  v_total int; v_completed int; v_pending int; v_in_progress int;
  v_materials_total int; v_category_count int; v_low int; v_txn_in_range int;
  v_top jsonb; v_low_list jsonb;
begin
  if not public.is_staff() then
    raise exception 'NOT_PERMITTED' using errcode = 'P0001';
  end if;
  if p_from is null or p_to is null or p_from > p_to or (p_to - p_from) > 366 then
    raise exception 'INVALID_RANGE' using errcode = 'P0001';
  end if;

  select count(*), count(*) filter (where status = 'completed'),
         count(*) filter (where status = 'pending'),
         count(*) filter (where status = 'in_progress')
  into v_total, v_completed, v_pending, v_in_progress
  from public.v_jobs_list where order_date between p_from and p_to;

  select count(*), count(distinct category) into v_materials_total, v_category_count
  from public.materials where deleted_at is null;

  select count(*) into v_low from public.v_material_status where stock_status in ('low_stock','out_of_stock');

  select count(*) into v_txn_in_range from public.inventory_transactions
  where created_at::date between p_from and p_to;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_top from (
    select m.name as material_name, m.unit as unit, sum(it.quantity) as total_quantity
    from public.inventory_transactions it
    join public.materials m on m.id = it.material_id
    where it.type = 'stock_out' and it.created_at::date between p_from and p_to
    group by m.name, m.unit
    order by total_quantity desc
    limit 4
  ) t;

  select coalesce(jsonb_agg(t), '[]'::jsonb) into v_low_list from (
    select name as material_name, material_code, current_stock, minimum_level, unit, stock_status
    from public.v_material_status
    where stock_status in ('out_of_stock','low_stock')
    order by (stock_status = 'out_of_stock') desc, shortfall desc, name asc
  ) t;

  return jsonb_build_object(
    'jobs_total', v_total, 'jobs_completed', v_completed,
    'jobs_pending', v_pending, 'jobs_in_progress', v_in_progress,
    'materials_total', v_materials_total, 'category_count', v_category_count,
    'low_stock_count', v_low, 'txn_in_range', v_txn_in_range,
    'top_materials', v_top, 'low_stock', v_low_list
  );
end $$;

create or replace function public.job_material_cost(p_job_id uuid)
returns numeric language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare
  v_cost numeric(14,2);
begin
  if not public.is_staff() then
    raise exception 'NOT_PERMITTED' using errcode = 'P0001';
  end if;

  select coalesce(sum(it.quantity * itc.unit_cost_at_time), 0) into v_cost
  from public.inventory_transactions it
  join public.inventory_transaction_costs itc on itc.transaction_id = it.id
  where it.job_id = p_job_id and it.type = 'stock_out';

  return v_cost;
end $$;

-- 3. explicit grants ----------------------------------------------------------
revoke execute on function public.dashboard_summary() from public, anon;
revoke execute on function public.report_summary(date, date) from public, anon;
revoke execute on function public.job_material_cost(uuid) from public, anon;

grant execute on function public.dashboard_summary() to authenticated, service_role;
grant execute on function public.report_summary(date, date) to authenticated, service_role;
grant execute on function public.job_material_cost(uuid) to authenticated, service_role;

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select * from v_material_status limit 1;    -- worker: ok, no money column
-- select dashboard_summary();                   -- any role: ok
-- select report_summary(current_date - 30, current_date);  -- worker: ERROR, NOT_PERMITTED
-- select job_material_cost('<a job id>');       -- worker: ERROR, NOT_PERMITTED ; owner: a number
-- anon key: select * from v_material_status;    -- ERROR, permission denied for view
