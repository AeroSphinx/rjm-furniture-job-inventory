-- supabase/seed/010_business_data.sql
-- Business data for the dev project (design §21.3). Generated against the
-- exact figures and consistency rules in the design document; every date is
-- expressed relative to current_date, never a literal, so the Dashboard and
-- Reports screens show real numbers on the day of grading (settled decision
-- D3). Re-running this file is safe: every insert uses a fixed UUID or code
-- with `on conflict ... do nothing`.

-- 0. Abort early with a readable message if `npm run seed` has not been run.
do $$
begin
  if (select count(*) from public.profiles
      where username in ('owner','admin','worker')) < 3 then
    raise exception
      'Seed order error: run `npm run seed` first (owner/admin/worker profiles missing)';
  end if;
end $$;

-- 1. customers --------------------------------------------------------------
with staff as (
  select
    (select id from public.profiles where username = 'owner')  as owner_id,
    (select id from public.profiles where username = 'admin')  as admin_id,
    (select id from public.profiles where username = 'worker') as worker_id
)
insert into public.customers (id, name, phone, address, created_by)
select v.id, v.name, v.phone, v.address, s.admin_id
from (values
  ('11111111-1111-4111-8111-000000000001'::uuid, 'Maria Santos', '0917 123 4567', 'Poblacion, Dasmariñas'),
  ('11111111-1111-4111-8111-000000000002'::uuid, 'Jose Reyes', '0918 234 5678', 'Barangay San Jose'),
  ('11111111-1111-4111-8111-000000000003'::uuid, 'Ana Villanueva', '0919 345 6789', 'Salitran IV'),
  ('11111111-1111-4111-8111-000000000004'::uuid, 'Paolo Garcia', '0920 456 7890', 'Burol Main'),
  ('11111111-1111-4111-8111-000000000005'::uuid, 'Liza Flores', '0921 567 8901', 'Paliparan III'),
  ('11111111-1111-4111-8111-000000000006'::uuid, 'Ramon Dizon', '0922 111 2222', 'Zone 3, Imus'),
  ('11111111-1111-4111-8111-000000000007'::uuid, 'Carmela Aquino', '0923 222 3333', 'San Agustin'),
  ('11111111-1111-4111-8111-000000000008'::uuid, 'Ferdinand Lopez', '0924 333 4444', 'Malagasang II'),
  ('11111111-1111-4111-8111-000000000009'::uuid, 'Teresa Bautista', '0925 444 5555', 'Anabu II'),
  ('11111111-1111-4111-8111-000000000010'::uuid, 'Noel Ramirez', '0926 555 6666', 'Bucandala V'),
  ('11111111-1111-4111-8111-000000000011'::uuid, 'Rosario Mercado', '0927 666 7777', 'Tanzang Luma'),
  ('11111111-1111-4111-8111-000000000012'::uuid, 'Edgar Castillo', '0928 777 8888', 'Pasong Kawayan'),
  ('11111111-1111-4111-8111-000000000013'::uuid, 'Luz Fernandez', '0929 888 9999', 'Toclong II-B'),
  ('11111111-1111-4111-8111-000000000014'::uuid, 'Danilo Pascual', '0930 999 0000', 'Alapan I-B'),
  ('11111111-1111-4111-8111-000000000015'::uuid, 'Imelda Torres', '0931 000 1111', 'Medicion I'),
  ('11111111-1111-4111-8111-000000000016'::uuid, 'Rodrigo Salazar', '0932 111 2222', 'Palico'),
  ('11111111-1111-4111-8111-000000000017'::uuid, 'Corazon Navarro', '0933 222 3333', 'Bagumbayan'),
  ('11111111-1111-4111-8111-000000000018'::uuid, 'Arturo Villareal', '0934 333 4444', 'Mabolo'),
  ('11111111-1111-4111-8111-000000000019'::uuid, 'Gloria Domingo', '0935 444 5555', 'San Nicolas'),
  ('11111111-1111-4111-8111-000000000020'::uuid, 'Bayani Ocampo', '0936 555 6666', 'Panungyanan')
) as v(id, name, phone, address)
cross join staff s
on conflict (id) do nothing;

-- 2. materials, inserted with their FINAL quantities already in place —
-- never updated afterwards (materials_block_stock_write is before-update
-- only, and the ledger below is what explains how each figure was reached).
with staff as (select (select id from public.profiles where username = 'owner') as owner_id)
insert into public.materials (material_code, name, category, unit, current_stock, minimum_level, created_by)
select v.code, v.name, v.category, v.unit, v.qty, v.min_level, s.owner_id
from (values
  ('MAT-001', 'Mahogany Lumber', 'Lumber', 'board ft', 18, 25),
  ('MAT-002', '3/4" Marine Plywood', 'Plywood', 'sheets', 12, 10),
  ('MAT-003', '2" Common Nails', 'Fasteners', 'kg', 0, 5),
  ('MAT-004', '1.5" Wood Screws', 'Fasteners', 'boxes', 14, 8),
  ('MAT-005', 'Narra Lumber', 'Lumber', 'board ft', 47, 15),
  ('MAT-006', '120-Grit Sandpaper', 'Finishing', 'sheets', 34, 20),
  ('MAT-007', 'Gmelina Lumber', 'Lumber', 'board ft', 27, 7),
  ('MAT-008', 'Wood Glue', 'Adhesives', 'liters', 6, 8),
  ('MAT-009', 'Acacia Lumber', 'Lumber', 'board ft', 44, 14),
  ('MAT-010', 'Cabinet Hinges', 'Hardware', 'pairs', 40, 10),
  ('MAT-011', 'Yakal Lumber', 'Lumber', 'board ft', 52, 7),
  ('MAT-012', 'Pine Lumber (SPF)', 'Lumber', 'board ft', 43, 17),
  ('MAT-013', 'Rubberwood Lumber', 'Lumber', 'board ft', 52, 11),
  ('MAT-014', 'Molave Lumber', 'Lumber', 'board ft', 31, 18),
  ('MAT-015', 'Kamagong Lumber', 'Lumber', 'board ft', 34, 15),
  ('MAT-016', 'Tanguile Lumber', 'Lumber', 'board ft', 34, 18),
  ('MAT-017', '1/2" Marine Plywood', 'Plywood', 'sheets', 45, 16),
  ('MAT-018', '1/4" Plywood', 'Plywood', 'sheets', 21, 9),
  ('MAT-019', '3/4" MDF Board', 'Plywood', 'sheets', 73, 24),
  ('MAT-020', 'Particle Board', 'Plywood', 'sheets', 35, 7),
  ('MAT-021', 'Lauan Plywood', 'Plywood', 'sheets', 42, 24),
  ('MAT-022', '1/2" Ordinary Plywood', 'Plywood', 'sheets', 45, 13),
  ('MAT-023', '1" Marine Plywood', 'Plywood', 'sheets', 39, 18),
  ('MAT-024', '1" Common Nails', 'Fasteners', 'kg', 57, 8),
  ('MAT-025', '3" Common Nails', 'Fasteners', 'kg', 33, 14),
  ('MAT-026', '2" Wood Screws', 'Fasteners', 'boxes', 39, 16),
  ('MAT-027', 'Clear Varnish', 'Finishing', 'liters', 4, 6),
  ('MAT-028', '3" Wood Screws', 'Fasteners', 'boxes', 49, 8),
  ('MAT-029', 'Finishing Nails', 'Fasteners', 'boxes', 36, 12),
  ('MAT-030', 'Staples', 'Fasteners', 'boxes', 54, 7),
  ('MAT-031', 'Wood Dowels', 'Fasteners', 'pieces', 55, 10),
  ('MAT-032', 'Corner Brackets', 'Fasteners', 'pairs', 33, 14),
  ('MAT-033', 'Contact Cement', 'Adhesives', 'liters', 43, 17),
  ('MAT-034', 'Epoxy Resin', 'Adhesives', 'liters', 56, 20),
  ('MAT-035', 'Wood Filler', 'Adhesives', 'liters', 27, 8),
  ('MAT-036', 'Silicone Sealant', 'Adhesives', 'liters', 28, 14),
  ('MAT-037', 'Super Glue', 'Adhesives', 'liters', 32, 6),
  ('MAT-038', 'PVA Glue', 'Adhesives', 'liters', 55, 19),
  ('MAT-039', 'Construction Adhesive', 'Adhesives', 'liters', 47, 24),
  ('MAT-040', '220-Grit Sandpaper', 'Finishing', 'liters', 44, 14),
  ('MAT-041', '80-Grit Sandpaper', 'Finishing', 'liters', 58, 14),
  ('MAT-042', 'Wood Stain', 'Finishing', 'liters', 42, 14),
  ('MAT-043', 'Lacquer Sealer', 'Finishing', 'liters', 29, 10),
  ('MAT-044', 'Sanding Sealer', 'Finishing', 'liters', 35, 20),
  ('MAT-045', 'Wood Oil Finish', 'Finishing', 'liters', 51, 10),
  ('MAT-046', 'Shellac', 'Finishing', 'liters', 71, 22),
  ('MAT-047', 'Polyurethane Coating', 'Finishing', 'liters', 68, 24),
  ('MAT-048', 'Drawer Slides', 'Hardware', 'pairs', 56, 20),
  ('MAT-049', 'Door Handles', 'Hardware', 'pairs', 27, 16),
  ('MAT-050', 'Cabinet Knobs', 'Hardware', 'pieces', 35, 11),
  ('MAT-051', 'Locks and Latches', 'Hardware', 'pieces', 35, 9),
  ('MAT-052', 'Furniture Legs', 'Hardware', 'pieces', 58, 19),
  ('MAT-053', 'Caster Wheels', 'Hardware', 'pairs', 58, 10),
  ('MAT-054', 'Shelf Brackets', 'Hardware', 'pairs', 29, 5),
  ('MAT-055', 'Piano Hinges', 'Hardware', 'pairs', 45, 17),
  ('MAT-056', 'Magnetic Catches', 'Hardware', 'pieces', 57, 7),
  ('MAT-057', 'Sandpaper Discs', 'Consumables', 'pieces', 59, 14),
  ('MAT-058', 'Masking Tape', 'Consumables', 'pieces', 46, 17),
  ('MAT-059', 'Wood Putty', 'Consumables', 'pieces', 50, 8),
  ('MAT-060', 'Cleaning Rags', 'Consumables', 'pieces', 44, 23),
  ('MAT-061', 'Cutting Discs', 'Consumables', 'pieces', 21, 5),
  ('MAT-062', 'Drill Bits', 'Consumables', 'pieces', 57, 19),
  ('MAT-063', 'Sanding Belts', 'Consumables', 'pieces', 63, 18),
  ('MAT-064', 'Paint Brushes', 'Consumables', 'pieces', 53, 10)
) as v(code, name, category, unit, qty, min_level)
cross join staff s
on conflict (material_code) do nothing;

-- 3. material_costs — a unit cost for every material, so the owner's reports
-- have figures and the worker's screens still show nothing.
with staff as (select (select id from public.profiles where username = 'owner') as owner_id)
insert into public.material_costs (material_id, unit_cost, updated_by)
select m.id, v.cost, s.owner_id
from (values
  ('MAT-001', 82.00),
  ('MAT-002', 469.00),
  ('MAT-003', 425.00),
  ('MAT-004', 349.00),
  ('MAT-005', 300.00),
  ('MAT-006', 269.00),
  ('MAT-007', 281.00),
  ('MAT-008', 343.00),
  ('MAT-009', 232.00),
  ('MAT-010', 79.00),
  ('MAT-011', 319.00),
  ('MAT-012', 34.00),
  ('MAT-013', 423.00),
  ('MAT-014', 426.00),
  ('MAT-015', 354.00),
  ('MAT-016', 72.00),
  ('MAT-017', 386.00),
  ('MAT-018', 434.00),
  ('MAT-019', 186.00),
  ('MAT-020', 398.00),
  ('MAT-021', 472.00),
  ('MAT-022', 487.00),
  ('MAT-023', 182.00),
  ('MAT-024', 189.00),
  ('MAT-025', 212.00),
  ('MAT-026', 419.00),
  ('MAT-027', 265.00),
  ('MAT-028', 44.00),
  ('MAT-029', 348.00),
  ('MAT-030', 420.00),
  ('MAT-031', 181.00),
  ('MAT-032', 169.00),
  ('MAT-033', 374.00),
  ('MAT-034', 343.00),
  ('MAT-035', 82.00),
  ('MAT-036', 327.00),
  ('MAT-037', 251.00),
  ('MAT-038', 287.00),
  ('MAT-039', 479.00),
  ('MAT-040', 105.00),
  ('MAT-041', 25.00),
  ('MAT-042', 70.00),
  ('MAT-043', 104.00),
  ('MAT-044', 455.00),
  ('MAT-045', 259.00),
  ('MAT-046', 448.00),
  ('MAT-047', 337.00),
  ('MAT-048', 287.00),
  ('MAT-049', 379.00),
  ('MAT-050', 351.00),
  ('MAT-051', 355.00),
  ('MAT-052', 94.00),
  ('MAT-053', 218.00),
  ('MAT-054', 181.00),
  ('MAT-055', 276.00),
  ('MAT-056', 136.00),
  ('MAT-057', 446.00),
  ('MAT-058', 163.00),
  ('MAT-059', 307.00),
  ('MAT-060', 390.00),
  ('MAT-061', 435.00),
  ('MAT-062', 451.00),
  ('MAT-063', 213.00),
  ('MAT-064', 333.00)
) as v(code, cost)
join public.materials m on m.material_code = v.code
cross join staff s
on conflict (material_id) do nothing;

-- 4. jobs — 42 orders, JO-<year>-001..042, split 29 completed / 7 pending /
-- 5 in_progress / 1 on_hold (the status-bar deviation, §7.1/§20). Five land
-- on positions 14-18 to match the wireframe rows exactly.
with staff as (
  select
    (select id from public.profiles where username = 'owner')  as owner_id,
    (select id from public.profiles where username = 'admin')  as admin_id,
    (select id from public.profiles where username = 'worker') as worker_id
)
insert into public.jobs (id, job_code, customer_id, project_name, order_date, expected_completion, assigned_to, status, created_by)
select
  ('22222222-2222-4222-8222-' || lpad(v.n::text, 12, '0'))::uuid,
  'JO-' || extract(year from current_date)::int || '-' || lpad((v.n)::text, 3, '0'),
  v.customer_id, v.project_name, v.order_date, v.expected_completion,
  case v.assignee when 'owner' then s.owner_id when 'admin' then s.admin_id else s.worker_id end,
  v.status, s.admin_id
from (values
  (1, '11111111-1111-4111-8111-000000000006'::uuid, 'Dining Table Set', (least(current_date, date_trunc('month', current_date)::date + 1))::date, (least(current_date, date_trunc('month', current_date)::date + 1) + 18)::date, 'admin', 'completed'),
  (2, '11111111-1111-4111-8111-000000000007'::uuid, 'Study Desk', (least(current_date, date_trunc('month', current_date)::date + 3))::date, (least(current_date, date_trunc('month', current_date)::date + 3) + 18)::date, 'owner', 'completed'),
  (3, '11111111-1111-4111-8111-000000000008'::uuid, 'Bookshelf', (least(current_date, date_trunc('month', current_date)::date + 5))::date, (least(current_date, date_trunc('month', current_date)::date + 5) + 18)::date, 'worker', 'completed'),
  (4, '11111111-1111-4111-8111-000000000009'::uuid, 'TV Console', (least(current_date, date_trunc('month', current_date)::date + 7))::date, (least(current_date, date_trunc('month', current_date)::date + 7) + 18)::date, 'admin', 'completed'),
  (5, '11111111-1111-4111-8111-000000000010'::uuid, 'Bar Stool Set', (least(current_date, date_trunc('month', current_date)::date + 9))::date, (least(current_date, date_trunc('month', current_date)::date + 9) + 18)::date, 'owner', 'completed'),
  (6, '11111111-1111-4111-8111-000000000011'::uuid, 'Kitchen Island', (least(current_date, date_trunc('month', current_date)::date + 11))::date, (least(current_date, date_trunc('month', current_date)::date + 11) + 18)::date, 'worker', 'completed'),
  (7, '11111111-1111-4111-8111-000000000012'::uuid, 'Wardrobe Cabinet', (current_date - 195)::date, (current_date - 195 + 18)::date, 'admin', 'completed'),
  (8, '11111111-1111-4111-8111-000000000013'::uuid, 'Shoe Rack', (current_date - 272)::date, (current_date - 272 + 18)::date, 'owner', 'completed'),
  (9, '11111111-1111-4111-8111-000000000014'::uuid, 'Garden Bench', (current_date - 90)::date, (current_date - 90 + 18)::date, 'worker', 'completed'),
  (10, '11111111-1111-4111-8111-000000000015'::uuid, 'Bed Headboard', (current_date - 32)::date, (current_date - 32 + 18)::date, 'admin', 'completed'),
  (11, '11111111-1111-4111-8111-000000000016'::uuid, 'Side Table', (current_date - 69)::date, (current_date - 69 + 18)::date, 'owner', 'completed'),
  (12, '11111111-1111-4111-8111-000000000017'::uuid, 'Display Cabinet', (current_date - 228)::date, (current_date - 228 + 18)::date, 'worker', 'completed'),
  (13, '11111111-1111-4111-8111-000000000018'::uuid, 'Rocking Chair', (current_date - 59)::date, (current_date - 59 + 18)::date, 'admin', 'completed'),
  (14, '11111111-1111-4111-8111-000000000005'::uuid, 'Coffee Table', (current_date - 99)::date, (current_date - 99 + 18)::date, 'worker', 'completed'),
  (15, '11111111-1111-4111-8111-000000000004'::uuid, 'Office Shelving', (current_date - 241)::date, (current_date - 241 + 18)::date, 'owner', 'completed'),
  (16, '11111111-1111-4111-8111-000000000003'::uuid, 'Queen Bed Frame', (current_date - 102)::date, (current_date - 102 + 30)::date, 'admin', 'on_hold'),
  (17, '11111111-1111-4111-8111-000000000002'::uuid, 'Kitchen Cabinets', (current_date - 186)::date, (current_date - 186 + 21)::date, 'worker', 'pending'),
  (18, '11111111-1111-4111-8111-000000000001'::uuid, '6-Seater Dining Set', (least(current_date, date_trunc('month', current_date)::date + 13))::date, (current_date + 3)::date, 'worker', 'in_progress'),
  (19, '11111111-1111-4111-8111-000000000019'::uuid, 'Baby Crib', (current_date - 286)::date, (current_date - 286 + 18)::date, 'admin', 'completed'),
  (20, '11111111-1111-4111-8111-000000000020'::uuid, 'Wine Rack', (current_date - 156)::date, (current_date - 156 + 18)::date, 'owner', 'completed'),
  (21, '11111111-1111-4111-8111-000000000001'::uuid, 'Picture Frame Set', (current_date - 90)::date, (current_date - 90 + 18)::date, 'worker', 'completed'),
  (22, '11111111-1111-4111-8111-000000000002'::uuid, 'Room Divider', (current_date - 136)::date, (current_date - 136 + 18)::date, 'admin', 'completed'),
  (23, '11111111-1111-4111-8111-000000000003'::uuid, 'Pantry Shelving', (current_date - 134)::date, (current_date - 134 + 18)::date, 'owner', 'completed'),
  (24, '11111111-1111-4111-8111-000000000004'::uuid, 'Work Bench', (current_date - 176)::date, (current_date - 176 + 18)::date, 'worker', 'completed'),
  (25, '11111111-1111-4111-8111-000000000005'::uuid, 'Plant Stand', (current_date - 78)::date, (current_date - 78 + 18)::date, 'admin', 'completed'),
  (26, '11111111-1111-4111-8111-000000000006'::uuid, 'Dresser', (current_date - 244)::date, (current_date - 244 + 18)::date, 'owner', 'completed'),
  (27, '11111111-1111-4111-8111-000000000007'::uuid, 'Nightstand Pair', (current_date - 36)::date, (current_date - 36 + 18)::date, 'worker', 'completed'),
  (28, '11111111-1111-4111-8111-000000000008'::uuid, 'Coat Rack', (current_date - 235)::date, (current_date - 235 + 18)::date, 'admin', 'completed'),
  (29, '11111111-1111-4111-8111-000000000009'::uuid, 'Window Bench', (current_date - 12)::date, (current_date - 12 + 18)::date, 'owner', 'completed'),
  (30, '11111111-1111-4111-8111-000000000010'::uuid, 'Serving Cart', (current_date - 95)::date, (current_date - 95 + 18)::date, 'worker', 'completed'),
  (31, '11111111-1111-4111-8111-000000000011'::uuid, 'Entertainment Unit', (current_date - 133)::date, (current_date - 133 + 18)::date, 'admin', 'completed'),
  (32, '11111111-1111-4111-8111-000000000012'::uuid, 'Closet Organizer', (current_date - 163)::date, (current_date - 163 + 18)::date, 'owner', 'completed'),
  (33, '11111111-1111-4111-8111-000000000013'::uuid, 'Kitchen Cart', (current_date - 179)::date, (current_date - 179 + 21)::date, 'worker', 'pending'),
  (34, '11111111-1111-4111-8111-000000000014'::uuid, 'Console Table', (current_date - 197)::date, (current_date - 197 + 21)::date, 'admin', 'pending'),
  (35, '11111111-1111-4111-8111-000000000015'::uuid, 'Storage Bench', (current_date - 221)::date, (current_date - 221 + 21)::date, 'owner', 'pending'),
  (36, '11111111-1111-4111-8111-000000000016'::uuid, 'Reception Desk', (current_date - 112)::date, (current_date - 112 + 21)::date, 'worker', 'pending'),
  (37, '11111111-1111-4111-8111-000000000017'::uuid, 'Filing Cabinet', (current_date - 252)::date, (current_date - 252 + 21)::date, 'admin', 'pending'),
  (38, '11111111-1111-4111-8111-000000000018'::uuid, 'Changing Table', (current_date - 12)::date, (current_date - 12 + 21)::date, 'owner', 'pending'),
  (39, '11111111-1111-4111-8111-000000000019'::uuid, 'Vanity Table', (current_date - 19)::date, (current_date + 6)::date, 'worker', 'in_progress'),
  (40, '11111111-1111-4111-8111-000000000020'::uuid, 'Corner Shelf', (current_date - 123)::date, (current_date + 15)::date, 'admin', 'in_progress'),
  (41, '11111111-1111-4111-8111-000000000001'::uuid, 'Patio Table Set', (current_date - 260)::date, (current_date + 25)::date, 'owner', 'in_progress'),
  (42, '11111111-1111-4111-8111-000000000002'::uuid, 'Umbrella Stand', (current_date - 26)::date, (greatest(current_date - 26, current_date - 2))::date, 'worker', 'in_progress')
) as v(n, customer_id, project_name, order_date, expected_completion, assignee, status)
cross join staff s
on conflict (id) do nothing;

-- 5. job_pricing — a quoted price for most jobs; a handful left unquoted.
with staff as (select (select id from public.profiles where username = 'owner') as owner_id)
insert into public.job_pricing (job_id, quoted_price, updated_by)
select j.id, v.price, s.owner_id
from (values
  (1, 8537.00),
  (2, 9074.00),
  (3, 9611.00),
  (4, 10148.00),
  (5, 10685.00),
  (6, 11222.00),
  (8, 12296.00),
  (9, 12833.00),
  (10, 13370.00),
  (11, 13907.00),
  (12, 14444.00),
  (13, 14981.00),
  (15, 16055.00),
  (16, 16592.00),
  (17, 17129.00),
  (18, 17666.00),
  (19, 18203.00),
  (20, 18740.00),
  (22, 19814.00),
  (23, 20351.00),
  (24, 20888.00),
  (25, 21425.00),
  (26, 21962.00),
  (27, 22499.00),
  (29, 23573.00),
  (30, 24110.00),
  (31, 24647.00),
  (32, 25184.00),
  (33, 25721.00),
  (34, 26258.00),
  (36, 27332.00),
  (37, 27869.00),
  (38, 28406.00),
  (39, 28943.00),
  (40, 29480.00),
  (41, 30017.00)
) as v(n, price)
join public.jobs j on j.job_code = 'JO-' || extract(year from current_date)::int || '-' || lpad((v.n)::text, 3, '0')
cross join staff s
on conflict (job_id) do nothing;

-- 6. the ledger, block (a): 64 opening counts, two months before the current
-- month so they never appear on page 1 of the Transactions list.
insert into public.inventory_transactions (id, txn_code, material_id, type, quantity, delta, reason, job_id, created_at, created_by)
select
  ('33333333-3333-4333-8333-' || lpad(v.n::text, 12, '0'))::uuid,
  'TXN-' || lpad(v.n::text, 4, '0'),
  m.id, 'adjustment', v.qty, v.qty, 'Opening stock count', null,
  (date_trunc('month', current_date) - interval '2 months' + (v.n || ' minutes')::interval),
  (select id from public.profiles where username = 'owner')
from (values
  (1, 'MAT-001', 124),
  (2, 'MAT-002', 24),
  (3, 'MAT-003', 5),
  (4, 'MAT-004', 24),
  (5, 'MAT-005', 45),
  (6, 'MAT-006', 34),
  (7, 'MAT-007', 30),
  (8, 'MAT-008', 10),
  (9, 'MAT-009', 40),
  (10, 'MAT-010', 20),
  (11, 'MAT-011', 57),
  (12, 'MAT-012', 37),
  (13, 'MAT-013', 59),
  (14, 'MAT-014', 29),
  (15, 'MAT-015', 37),
  (16, 'MAT-016', 30),
  (17, 'MAT-017', 50),
  (18, 'MAT-018', 15),
  (19, 'MAT-019', 80),
  (20, 'MAT-020', 33),
  (21, 'MAT-021', 45),
  (22, 'MAT-022', 41),
  (23, 'MAT-023', 44),
  (24, 'MAT-024', 51),
  (25, 'MAT-025', 40),
  (26, 'MAT-026', 37),
  (27, 'MAT-027', 6),
  (28, 'MAT-028', 52),
  (29, 'MAT-029', 32),
  (30, 'MAT-030', 59),
  (31, 'MAT-031', 49),
  (32, 'MAT-032', 40),
  (33, 'MAT-033', 41),
  (34, 'MAT-034', 59),
  (35, 'MAT-035', 23),
  (36, 'MAT-036', 33),
  (37, 'MAT-037', 26),
  (38, 'MAT-038', 62),
  (39, 'MAT-039', 47),
  (40, 'MAT-040', 44),
  (41, 'MAT-041', 58),
  (42, 'MAT-042', 42),
  (43, 'MAT-043', 29),
  (44, 'MAT-044', 35),
  (45, 'MAT-045', 51),
  (46, 'MAT-046', 71),
  (47, 'MAT-047', 68),
  (48, 'MAT-048', 56),
  (49, 'MAT-049', 27),
  (50, 'MAT-050', 35),
  (51, 'MAT-051', 35),
  (52, 'MAT-052', 58),
  (53, 'MAT-053', 58),
  (54, 'MAT-054', 29),
  (55, 'MAT-055', 45),
  (56, 'MAT-056', 57),
  (57, 'MAT-057', 59),
  (58, 'MAT-058', 46),
  (59, 'MAT-059', 50),
  (60, 'MAT-060', 44),
  (61, 'MAT-061', 21),
  (62, 'MAT-062', 57),
  (63, 'MAT-063', 63),
  (64, 'MAT-064', 53)
) as v(n, code, qty)
join public.materials m on m.material_code = v.code
on conflict (id) do nothing;

-- 7. the ledger, block (b): 45 movement rows inside the current month,
-- TXN-1050..TXN-1094. The five named rows are days 1050+index below and
-- carry the wireframe's material, type, quantity and reason.
insert into public.inventory_transactions (id, txn_code, material_id, type, quantity, delta, reason, job_id, created_at, created_by)
select
  ('44444444-4444-4444-8444-' || lpad(v.n::text, 12, '0'))::uuid,
  'TXN-' || v.n,
  m.id, v.type, v.qty, v.delta, v.reason,
  (select id from public.jobs where job_code = v.job_code),
  (date_trunc('month', current_date) + (v.day_offset || ' days')::interval + (v.n || ' minutes')::interval),
  (select id from public.profiles where username = v.created_by)
from (values
  (1050, 'MAT-001', 'stock_out', 12, -12, 'Used for dining set', ('JO-' || extract(year from current_date)::int || '-' || lpad((018)::text, 3, '0')), 1, 'worker'),
  (1051, 'MAT-001', 'stock_out', 30, -30, 'Framing for cabinets', null, 2, 'worker'),
  (1052, 'MAT-001', 'stock_out', 34, -34, 'Queen bed frame panels', ('JO-' || extract(year from current_date)::int || '-' || lpad((016)::text, 3, '0')), 3, 'worker'),
  (1053, 'MAT-001', 'stock_out', 30, -30, 'Office shelving boards', ('JO-' || extract(year from current_date)::int || '-' || lpad((015)::text, 3, '0')), 4, 'worker'),
  (1054, 'MAT-002', 'stock_in', 20, 20, 'Supplier delivery', null, 5, 'admin'),
  (1055, 'MAT-002', 'stock_out', 6, -6, 'Kitchen cabinet panels', ('JO-' || extract(year from current_date)::int || '-' || lpad((017)::text, 3, '0')), 6, 'worker'),
  (1056, 'MAT-002', 'stock_out', 26, -26, 'Shelving and cabinet backs', null, 7, 'worker'),
  (1057, 'MAT-003', 'stock_out', 5, -5, null, null, 8, 'worker'),
  (1058, 'MAT-004', 'stock_out', 6, -6, 'Drawer assembly', null, 9, 'worker'),
  (1059, 'MAT-004', 'stock_out', 4, -4, 'Cabinet hardware mounting', null, 10, 'worker'),
  (1060, 'MAT-008', 'stock_in', 10, 10, 'Supplier delivery', null, 11, 'admin'),
  (1061, 'MAT-008', 'stock_out', 8, -8, 'Finishing coat glue-up', null, 12, 'worker'),
  (1062, 'MAT-008', 'stock_out', 6, -6, 'Joint assembly', null, 13, 'worker'),
  (1063, 'MAT-010', 'stock_in', 20, 20, 'Regular restock', null, 14, 'admin'),
  (1064, 'MAT-027', 'stock_out', 2, -2, 'Finishing coat', ('JO-' || extract(year from current_date)::int || '-' || lpad((018)::text, 3, '0')), 15, 'worker'),
  (1065, 'MAT-005', 'stock_in', 2, 2, 'Supplier delivery', null, 16, 'admin'),
  (1066, 'MAT-007', 'stock_out', 3, -3, 'Issued for workshop job', null, 17, 'worker'),
  (1067, 'MAT-009', 'stock_in', 4, 4, 'Bulk purchase', null, 18, 'admin'),
  (1068, 'MAT-011', 'stock_out', 5, -5, 'General workshop use', null, 19, 'worker'),
  (1069, 'MAT-012', 'stock_in', 6, 6, 'Supplier delivery', null, 20, 'admin'),
  (1070, 'MAT-013', 'stock_out', 7, -7, 'Issued for workshop job', null, 21, 'worker'),
  (1071, 'MAT-014', 'stock_in', 2, 2, 'Bulk purchase', null, 22, 'admin'),
  (1072, 'MAT-015', 'stock_out', 3, -3, 'General workshop use', null, 23, 'worker'),
  (1073, 'MAT-016', 'stock_in', 4, 4, 'Supplier delivery', null, 24, 'admin'),
  (1074, 'MAT-017', 'stock_out', 5, -5, 'Issued for workshop job', null, 25, 'worker'),
  (1075, 'MAT-018', 'stock_in', 6, 6, 'Bulk purchase', null, 26, 'admin'),
  (1076, 'MAT-019', 'stock_out', 7, -7, 'General workshop use', null, 1, 'worker'),
  (1077, 'MAT-020', 'stock_in', 2, 2, 'Supplier delivery', null, 2, 'admin'),
  (1078, 'MAT-021', 'stock_out', 3, -3, 'Issued for workshop job', null, 3, 'worker'),
  (1079, 'MAT-022', 'stock_in', 4, 4, 'Bulk purchase', null, 4, 'admin'),
  (1080, 'MAT-023', 'stock_out', 5, -5, 'General workshop use', null, 5, 'worker'),
  (1081, 'MAT-024', 'stock_in', 6, 6, 'Supplier delivery', null, 6, 'admin'),
  (1082, 'MAT-025', 'stock_out', 7, -7, 'Issued for workshop job', null, 7, 'worker'),
  (1083, 'MAT-026', 'stock_in', 2, 2, 'Bulk purchase', null, 8, 'admin'),
  (1084, 'MAT-028', 'stock_out', 3, -3, 'General workshop use', null, 9, 'worker'),
  (1085, 'MAT-029', 'stock_in', 4, 4, 'Supplier delivery', null, 10, 'admin'),
  (1086, 'MAT-030', 'stock_out', 5, -5, 'Issued for workshop job', null, 11, 'worker'),
  (1087, 'MAT-031', 'stock_in', 6, 6, 'Bulk purchase', null, 12, 'admin'),
  (1088, 'MAT-032', 'stock_out', 7, -7, 'General workshop use', null, 13, 'worker'),
  (1089, 'MAT-033', 'stock_in', 2, 2, 'Supplier delivery', null, 14, 'admin'),
  (1090, 'MAT-034', 'stock_out', 3, -3, 'Issued for workshop job', null, 15, 'worker'),
  (1091, 'MAT-035', 'stock_in', 4, 4, 'Bulk purchase', null, 16, 'admin'),
  (1092, 'MAT-036', 'stock_out', 5, -5, 'General workshop use', null, 17, 'worker'),
  (1093, 'MAT-037', 'stock_in', 6, 6, 'Supplier delivery', null, 18, 'admin'),
  (1094, 'MAT-038', 'stock_out', 7, -7, 'Issued for workshop job', null, 19, 'worker')
) as v(n, code, type, qty, delta, reason, job_code, day_offset, created_by)
join public.materials m on m.material_code = v.code
on conflict (id) do nothing;

-- 8. inventory_transaction_costs — one row per ledger entry, stamped from
-- each material's unit cost at the time (here, simply its current cost —
-- this is seed data, not a point-in-time repricing exercise).
insert into public.inventory_transaction_costs (transaction_id, unit_cost_at_time)
select t.id, mc.unit_cost
from public.inventory_transactions t
join public.material_costs mc on mc.material_id = t.material_id
on conflict (transaction_id) do nothing;

-- 9. consistency assertion — sum(delta) must equal current_stock for every
-- material (design §21.3). This is the compensating control for the
-- "insert materials with their final quantity already in place" approach.
do $$
begin
  if exists (
    select 1 from public.materials m
    left join (select material_id, sum(delta) d from public.inventory_transactions group by 1) t
      on t.material_id = m.id
    where coalesce(t.d, 0) <> m.current_stock)
  then raise exception 'Seed inconsistent: current_stock does not equal sum(delta)';
  end if;
end $$;

-- 10. date-centring assertion — the figures the Dashboard and Reports
-- screens depend on being non-zero on the day of grading.
do $$
declare v_month int; v_week int; v_txn int;
begin
  select count(*) into v_month from public.jobs
    where order_date >= date_trunc('month', current_date) and deleted_at is null;
  select count(*) into v_week  from public.jobs
    where status = 'in_progress' and deleted_at is null
      and expected_completion between current_date and current_date + 7;
  select count(*) into v_txn   from public.inventory_transactions
    where created_at >= date_trunc('month', current_date);
  if v_month < 6 or v_week <> 2 or v_txn < 38 then
    raise exception
      'Seed not centred on the current month (jobs this month %, due this week %, txns %)',
      v_month, v_week, v_txn;
  end if;
end $$;

-- 11. catch the counters up to the seeded data, so the first hand-added
-- record cannot collide with a seeded code.
select setval('public.material_code_seq',    64);     -- next hand-added material: MAT-065
select setval('public.transaction_code_seq', 1094);   -- next recorded movement: TXN-1095

insert into public.job_code_counters (year, last_seq)
values (extract(year from current_date)::int, 42)
on conflict (year) do update
  set last_seq = greatest(job_code_counters.last_seq, 42);   -- next job: JO-<year>-043
