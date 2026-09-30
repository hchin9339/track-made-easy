-- Team tenancy, membership, and least-privilege RLS.
-- Existing demo rows are retained in an inaccessible legacy workspace; authenticated
-- teams start with their own categories through create_team().

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- Keep the original demo records for recovery without exposing them to users.
insert into public.teams (id, name, slug)
values ('d0000000-0000-0000-0000-000000000001', 'Legacy demo', 'legacy-demo')
on conflict (id) do nothing;

alter table public.categories add column team_id uuid references public.teams(id);
alter table public.budgets add column team_id uuid references public.teams(id);
alter table public.expenses add column team_id uuid references public.teams(id);

update public.categories set team_id = 'd0000000-0000-0000-0000-000000000001' where team_id is null;
update public.budgets set team_id = 'd0000000-0000-0000-0000-000000000001' where team_id is null;
update public.expenses set team_id = 'd0000000-0000-0000-0000-000000000001' where team_id is null;

alter table public.categories alter column team_id set not null;
alter table public.budgets alter column team_id set not null;
alter table public.expenses alter column team_id set not null;

alter table public.categories add constraint categories_id_team_unique unique (id, team_id);
alter table public.budgets add constraint budgets_id_team_unique unique (id, team_id);

alter table public.budgets drop constraint if exists budgets_category_id_fkey;
alter table public.budgets
  add constraint budgets_category_team_fkey foreign key (category_id, team_id)
  references public.categories(id, team_id) on delete cascade;

alter table public.expenses drop constraint if exists expenses_category_id_fkey;
alter table public.expenses drop constraint if exists expenses_budget_id_fkey;
alter table public.expenses
  add constraint expenses_category_team_fkey foreign key (category_id, team_id)
  references public.categories(id, team_id) on delete cascade;
alter table public.expenses
  add constraint expenses_budget_team_fkey foreign key (budget_id, team_id)
  references public.budgets(id, team_id) on delete set null (budget_id);

alter table public.budgets drop constraint if exists budgets_category_id_month_key;
alter table public.budgets
  add constraint budgets_team_category_month_key unique (team_id, category_id, month);
create unique index categories_team_name_key on public.categories (team_id, lower(name));
create index categories_team_id_idx on public.categories (team_id);
create index budgets_team_month_idx on public.budgets (team_id, month);
create index expenses_team_month_idx on public.expenses (team_id, month);
create index team_members_user_id_idx on public.team_members (user_id);

create or replace function public.is_team_member(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_team_manager(check_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = check_team_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_team_member(uuid) from public;
revoke all on function public.is_team_manager(uuid) from public;
grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.is_team_manager(uuid) to authenticated;

create or replace function public.create_team(team_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team_id uuid;
  clean_name text := trim(team_name);
  new_slug text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(clean_name) not between 1 and 80 then raise exception 'Team name must be 1-80 characters'; end if;
  new_slug := trim(both '-' from regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'));
  if new_slug = '' then new_slug := 'team'; end if;
  new_slug := left(new_slug, 48) || '-' || encode(gen_random_bytes(3), 'hex');

  insert into public.teams(name, slug, created_by)
  values (clean_name, new_slug, auth.uid()) returning id into new_team_id;
  insert into public.team_members(team_id, user_id, role)
  values (new_team_id, auth.uid(), 'owner');
  insert into public.categories(team_id, name, user_id) values
    (new_team_id, 'Digital Ads', auth.uid()),
    (new_team_id, 'Events', auth.uid()),
    (new_team_id, 'Print', auth.uid()),
    (new_team_id, 'PR & Media', auth.uid()),
    (new_team_id, 'Collateral', auth.uid());
  return new_team_id;
end;
$$;

revoke all on function public.create_team(text) from public;
grant execute on function public.create_team(text) to authenticated;

-- Prevent members from changing ownership/tenant fields or self-approving expenses.
create or replace function public.protect_expense_security_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.team_id is distinct from old.team_id or new.user_id is distinct from old.user_id then
    raise exception 'Expense ownership cannot be changed';
  end if;
  if new.status is distinct from old.status and not public.is_team_manager(old.team_id) then
    raise exception 'Only a team manager can change expense approval status';
  end if;
  return new;
end;
$$;

create trigger protect_expense_security_fields
before update on public.expenses
for each row execute function public.protect_expense_security_fields();

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "categories_v1_read" on public.categories;
drop policy if exists "categories_v1_write" on public.categories;
drop policy if exists "budgets_v1_read" on public.budgets;
drop policy if exists "budgets_v1_write" on public.budgets;
drop policy if exists "expenses_v1_read" on public.expenses;
drop policy if exists "expenses_v1_write" on public.expenses;

create policy teams_read on public.teams for select to authenticated
  using (public.is_team_member(id));
create policy teams_manage on public.teams for update to authenticated
  using (public.is_team_manager(id)) with check (public.is_team_manager(id));

create policy members_read on public.team_members for select to authenticated
  using (public.is_team_member(team_id));
create policy members_add on public.team_members for insert to authenticated
  with check (public.is_team_manager(team_id));
create policy members_update on public.team_members for update to authenticated
  using (public.is_team_manager(team_id)) with check (public.is_team_manager(team_id));
create policy members_remove on public.team_members for delete to authenticated
  using (public.is_team_manager(team_id) and user_id <> auth.uid());

create policy categories_read on public.categories for select to authenticated
  using (public.is_team_member(team_id));
create policy categories_create on public.categories for insert to authenticated
  with check (public.is_team_manager(team_id) and user_id = auth.uid());
create policy categories_update on public.categories for update to authenticated
  using (public.is_team_manager(team_id)) with check (public.is_team_manager(team_id));
create policy categories_delete on public.categories for delete to authenticated
  using (public.is_team_manager(team_id));

create policy budgets_read on public.budgets for select to authenticated
  using (public.is_team_member(team_id));
create policy budgets_create on public.budgets for insert to authenticated
  with check (public.is_team_manager(team_id) and user_id = auth.uid());
create policy budgets_update on public.budgets for update to authenticated
  using (public.is_team_manager(team_id)) with check (public.is_team_manager(team_id));
create policy budgets_delete on public.budgets for delete to authenticated
  using (public.is_team_manager(team_id));

create policy expenses_read on public.expenses for select to authenticated
  using (public.is_team_member(team_id));
create policy expenses_create on public.expenses for insert to authenticated
  with check (public.is_team_member(team_id) and user_id = auth.uid());
create policy expenses_update on public.expenses for update to authenticated
  using (public.is_team_manager(team_id) or (public.is_team_member(team_id) and user_id = auth.uid()))
  with check (public.is_team_manager(team_id) or (public.is_team_member(team_id) and user_id = auth.uid()));
create policy expenses_delete on public.expenses for delete to authenticated
  using (public.is_team_manager(team_id));
