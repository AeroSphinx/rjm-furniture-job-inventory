-- supabase/migrations/0005_materials_costs.sql
-- Purpose: materials (workshop stock) + the owner/admin-only unit cost table.
-- Roles: everyone signed in may read materials; owner and admin_staff may add
-- and edit them; nobody may write current_stock directly (see 0008 stock RPC).

begin;

-- 1. objects ------------------------------------------------------------
create table public.materials (
  id             uuid primary key default gen_random_uuid(),
  material_code  text not null unique,                           -- MAT-NNN
  name           text not null check (char_length(name) between 2 and 120),
  category       text not null check (category in
                   ('Lumber','Plywood','Fasteners','Adhesives',
                    'Finishing','Hardware','Consumables')),
  unit           text not null check (unit in
                   ('board ft','sheets','kg','liters','boxes','pairs','pieces')),
  current_stock  numeric(14,4) not null default 0 check (current_stock >= 0),
  minimum_level  numeric(14,4) not null default 0 check (minimum_level >= 0),
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create unique index materials_name_per_category_key
  on public.materials (lower(name), lower(category)) where deleted_at is null;
create index materials_low_stock_idx on public.materials (current_stock, minimum_level)
  where deleted_at is null;

create table public.material_costs (                    -- money, owner + admin only
  material_id uuid primary key references public.materials(id) on delete cascade,
  unit_cost   numeric(12,2) not null check (unit_cost >= 0),
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);

create trigger materials_touch before update on public.materials
  for each row execute function public.touch_updated_at();
create trigger material_costs_touch before update on public.material_costs
  for each row execute function public.touch_updated_at();

-- Belt and braces next to the column grant (§12.3): if current_stock changes
-- outside record_stock_movement()'s one-statement window, refuse the write.
create or replace function public.materials_block_stock_write() returns trigger
language plpgsql as $$
begin
  if new.current_stock is distinct from old.current_stock
     and coalesce(current_setting('app.stock_rpc', true), 'off') <> 'on' then
    raise exception 'STOCK_NOT_DIRECTLY_EDITABLE' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger materials_block_stock_write before update on public.materials
  for each row execute function public.materials_block_stock_write();

-- 2. RLS on, always -------------------------------------------------------
alter table public.materials      enable row level security;
alter table public.material_costs enable row level security;

-- 3. explicit grants ("auto expose new tables" is OFF) -------------------
grant select on public.materials to authenticated;
-- No INSERT grant: a material is created only by upsert_material() (0009),
-- which is where MAT-NNN is minted.
grant update (deleted_at, updated_at)
  on public.materials to authenticated;      -- soft delete + Undo only;
                                             -- current_stock deliberately absent
grant select, insert, update on public.material_costs to authenticated;
grant all on public.materials, public.material_costs to service_role;

-- 4. + 5. policies, each with its plain-English note ---------------------
-- Everyone signed in can read the material list: carpenters need to know
-- what is in the workshop, and the list carries no money column.
create policy materials_select_all on public.materials
  for select to authenticated using (true);

-- Only the owner and admin staff soft-delete or restore a material. The
-- column grant above narrows this to deleted_at/updated_at, so name,
-- category, unit, minimum level and (above all) current_stock cannot be
-- written from a client at all: editing those goes through upsert_material().
create policy materials_update_staff on public.materials
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Unit cost is money: only the owner and admin staff may read, add or
-- change it. A carpenter gets no policy at all, so the table returns zero
-- rows. Three policies, not one `for all`, because we deliberately do not
-- want the DELETE half of ALL (together with the grant above, a cost can
-- be corrected but never erased from the browser, §8.1).
create policy material_costs_select_staff on public.material_costs
  for select to authenticated using (public.is_staff());
create policy material_costs_insert_staff on public.material_costs
  for insert to authenticated with check (public.is_staff());
create policy material_costs_update_staff on public.material_costs
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

commit;

-- 7. smoke test (paste into the SQL editor while signed in as each demo user)
-- select count(*) from materials;        -- worker: > 0
-- select count(*) from material_costs;   -- worker: 0 ; owner: > 0
-- update materials set current_stock = 999 where material_code = 'MAT-001';
--                                        -- everyone: ERROR, no privilege
-- insert into materials (material_code, name, category, unit, minimum_level)
--   values ('MAT-999','Hand-written','Lumber','sheets',1);
--                                        -- everyone incl. owner: ERROR, no privilege
-- anon key: select count(*) from materials;  -- ERROR, permission denied for table materials
