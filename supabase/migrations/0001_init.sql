create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);
alter table categories enable row level security;
drop policy if exists "categories_v1_read" on categories;
create policy "categories_v1_read" on categories for select using (true);
drop policy if exists "categories_v1_write" on categories;
create policy "categories_v1_write" on categories for all using (true) with check (true);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  month date not null,
  approved_amount numeric(12,2) not null default 0,
  user_id uuid,
  created_at timestamptz not null default now(),
  unique (category_id, month)
);
alter table budgets enable row level security;
drop policy if exists "budgets_v1_read" on budgets;
create policy "budgets_v1_read" on budgets for select using (true);
drop policy if exists "budgets_v1_write" on budgets;
create policy "budgets_v1_write" on budgets for all using (true) with check (true);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  budget_id uuid references budgets(id) on delete set null,
  vendor text not null,
  description text default '',
  amount numeric(12,2) not null default 0,
  expense_date date not null default current_date,
  month date not null default date_trunc('month', current_date),
  status text not null default 'committed',
  notes text default '',
  ai_category text,
  ai_source text,
  ai_confidence numeric,
  ai_review_status text default 'unreviewed',
  user_id uuid,
  created_at timestamptz not null default now()
);
alter table expenses enable row level security;
drop policy if exists "expenses_v1_read" on expenses;
create policy "expenses_v1_read" on expenses for select using (true);
drop policy if exists "expenses_v1_write" on expenses;
create policy "expenses_v1_write" on expenses for all using (true) with check (true);

insert into categories (id, name) values
  ('c0000000-0000-0000-0000-000000000001', 'Digital Ads'),
  ('c0000000-0000-0000-0000-000000000002', 'Events'),
  ('c0000000-0000-0000-0000-000000000003', 'Print'),
  ('c0000000-0000-0000-0000-000000000004', 'PR & Media'),
  ('c0000000-0000-0000-0000-000000000005', 'Collateral')
on conflict do nothing;

insert into budgets (id, category_id, month, approved_amount) values
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', date_trunc('month', current_date), 10000.00),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', date_trunc('month', current_date), 15000.00),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', date_trunc('month', current_date), 5000.00),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004', date_trunc('month', current_date), 8000.00),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', date_trunc('month', current_date), 3000.00)
on conflict do nothing;

insert into expenses (id, category_id, budget_id, vendor, description, amount, expense_date, month, status, notes) values
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Meta', 'November social media campaign', 3200.00, current_date, date_trunc('month', current_date), 'actual', 'Approved by superior'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Google Ads', 'Search ads - Q4 push', 1800.00, current_date, date_trunc('month', current_date), 'committed', 'Awaiting approval'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Grand Hyatt', 'Annual dealer conference venue', 9500.00, current_date, date_trunc('month', current_date), 'actual', 'Deposit paid'),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'PrintWorks Co', 'Product brochures - 5000 units', 2200.00, current_date, date_trunc('month', current_date), 'committed', 'Quote received'),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'PR Wire', 'Press release distribution', 1500.00, current_date, date_trunc('month', current_date), 'actual', 'Distributed Nov 1'),
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'PromoShop', 'Branded tote bags - 1000 units', 800.00, current_date, date_trunc('month', current_date), 'committed', 'Pending sample review')
on conflict do nothing;