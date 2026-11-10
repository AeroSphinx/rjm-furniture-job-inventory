-- supabase/migrations/0006_inventory_transactions.sql
-- Purpose: the append-only stock ledger and its owner/admin-only historical
-- unit-cost sidecar.
-- Roles: everyone signed in can read the whole ledger (traceability, no
-- money column); nobody gets an insert/update/delete grant on either table
-- — the only writer of both is record_stock_movement() (migration 0008).

begin;

-- 1. objects ------------------------------------------------------------
create table public.inventory_transactions (
  id          uuid primary key default gen_random_uuid(),
  txn_code    text not null unique,                              -- TXN-NNNN
  material_id uuid not null references public.materials(id) on delete restrict,
  type        text not null check (type in ('stock_in','stock_out','adjustment')),
  quantity    numeric(14,4) not null check (quantity > 0),        -- always a magnitude
  delta       numeric(14,4) not null,                            -- signed effect on stock
  reason      text check (reason is null or char_length(reason) <= 300),
  job_id      uuid references public.jobs(id) on delete set null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint txn_delta_matches_type check (
    (type = 'stock_in'  and delta =  quantity) or
    (type = 'stock_out' and delta = -quantity) or
    (type = 'adjustment' and abs(delta) = quantity)),
  constraint txn_reason_required check (
    type = 'stock_out' or (reason is not null and char_length(btrim(reason)) > 0))
);
create index txn_recent_idx   on public.inventory_transactions (created_at desc);
create index txn_material_idx on public.inventory_transactions (material_id, created_at desc);
create index txn_job_idx      on public.inventory_transactions (job_id);

create table public.inventory_transaction_costs (       -- money, owner + admin only
  transaction_id    uuid primary key
                      references public.inventory_transactions(id) on delete cascade,
  unit_cost_at_time numeric(12,2)                       -- nullable only for legacy rows: a
                      -- material created by hand before upsert_material() required a cost
);

-- 2. RLS on, always -------------------------------------------------------
alter table public.inventory_transactions      enable row level security;
alter table public.inventory_transaction_costs enable row level security;

-- 3. explicit grants ------------------------------------------------------
grant select on public.inventory_transactions to authenticated;
-- No insert, update or delete: the ledger is append-only and
-- record_stock_movement() is its only writer.
grant select on public.inventory_transaction_costs to authenticated;
-- Written by the stock function only — no insert/update/delete grant here.

grant all on public.inventory_transactions, public.inventory_transaction_costs to service_role;

-- 4. + 5. policies, each with its plain-English note ---------------------
-- Everyone signed in can read the whole ledger. It is the shop's
-- traceability record and carries no money column.
create policy txn_select_all on public.inventory_transactions
  for select to authenticated using (true);

-- The historical unit cost is money: owner and admin staff only. Written by
-- the stock function, never by a client.
create policy txn_costs_select_staff on public.inventory_transaction_costs
  for select to authenticated using (public.is_staff());

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select count(*) from inventory_transactions;        -- worker: can read (0 rows until seeded)
-- select count(*) from inventory_transaction_costs;   -- worker: 0 rows (permission has them, but
--                                                      -- policy returns none); owner: readable
-- insert into inventory_transactions (txn_code, material_id, type, quantity, delta)
--   values ('TXN-HAND','<a material id>','stock_in',1,1);  -- everyone incl. owner: ERROR, no privilege
-- anon key: select count(*) from inventory_transactions;  -- ERROR, permission denied for table
