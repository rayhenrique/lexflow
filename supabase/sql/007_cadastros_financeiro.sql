create sequence if not exists public.revenue_classification_code_seq start 1;
create sequence if not exists public.expense_classification_code_seq start 1;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  cpf text,
  phone text,
  address text,
  process_number text,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_classifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  code text not null unique,
  description text,
  active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_classifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  code text not null unique,
  description text,
  active boolean not null default true,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  occurred_on date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  classification_id uuid not null references public.revenue_classifications (id) on delete restrict,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  occurred_on date not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  classification_id uuid not null references public.expense_classifications (id) on delete restrict,
  notes text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_workspace_id on public.clients (workspace_id);
create index if not exists idx_revenue_classifications_workspace_id on public.revenue_classifications (workspace_id);
create index if not exists idx_expense_classifications_workspace_id on public.expense_classifications (workspace_id);
create index if not exists idx_revenues_workspace_id on public.revenues (workspace_id);
create index if not exists idx_expenses_workspace_id on public.expenses (workspace_id);
create index if not exists idx_revenues_client_id on public.revenues (client_id);
create index if not exists idx_expenses_client_id on public.expenses (client_id);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_revenue_classification_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or length(trim(new.code)) = 0 then
    new.code := 'REC-' || lpad(nextval('public.revenue_classification_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create or replace function public.set_expense_classification_code()
returns trigger
language plpgsql
as $$
begin
  if new.code is null or length(trim(new.code)) = 0 then
    new.code := 'DES-' || lpad(nextval('public.expense_classification_code_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_revenue_classifications_updated_at on public.revenue_classifications;
create trigger trg_revenue_classifications_updated_at
before update on public.revenue_classifications
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_expense_classifications_updated_at on public.expense_classifications;
create trigger trg_expense_classifications_updated_at
before update on public.expense_classifications
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_revenues_updated_at on public.revenues;
create trigger trg_revenues_updated_at
before update on public.revenues
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists trg_revenue_classifications_code on public.revenue_classifications;
create trigger trg_revenue_classifications_code
before insert on public.revenue_classifications
for each row execute function public.set_revenue_classification_code();

drop trigger if exists trg_expense_classifications_code on public.expense_classifications;
create trigger trg_expense_classifications_code
before insert on public.expense_classifications
for each row execute function public.set_expense_classification_code();

alter table public.clients enable row level security;
alter table public.revenue_classifications enable row level security;
alter table public.expense_classifications enable row level security;
alter table public.revenues enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "clients_select_scoped" on public.clients;
drop policy if exists "clients_insert_scoped" on public.clients;
drop policy if exists "clients_update_scoped" on public.clients;
drop policy if exists "clients_delete_scoped" on public.clients;
create policy "clients_select_scoped"
  on public.clients
  for select
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = clients.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "clients_insert_scoped"
  on public.clients
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = clients.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "clients_update_scoped"
  on public.clients
  for update
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = clients.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = clients.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "clients_delete_scoped"
  on public.clients
  for delete
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = clients.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "revenue_classifications_select_scoped" on public.revenue_classifications;
drop policy if exists "revenue_classifications_insert_scoped" on public.revenue_classifications;
drop policy if exists "revenue_classifications_update_scoped" on public.revenue_classifications;
drop policy if exists "revenue_classifications_delete_scoped" on public.revenue_classifications;
create policy "revenue_classifications_select_scoped"
  on public.revenue_classifications
  for select
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenue_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "revenue_classifications_insert_scoped"
  on public.revenue_classifications
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenue_classifications.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "revenue_classifications_update_scoped"
  on public.revenue_classifications
  for update
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenue_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenue_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "revenue_classifications_delete_scoped"
  on public.revenue_classifications
  for delete
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenue_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "expense_classifications_select_scoped" on public.expense_classifications;
drop policy if exists "expense_classifications_insert_scoped" on public.expense_classifications;
drop policy if exists "expense_classifications_update_scoped" on public.expense_classifications;
drop policy if exists "expense_classifications_delete_scoped" on public.expense_classifications;
create policy "expense_classifications_select_scoped"
  on public.expense_classifications
  for select
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expense_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "expense_classifications_insert_scoped"
  on public.expense_classifications
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = expense_classifications.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "expense_classifications_update_scoped"
  on public.expense_classifications
  for update
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expense_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expense_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "expense_classifications_delete_scoped"
  on public.expense_classifications
  for delete
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expense_classifications.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "revenues_select_scoped" on public.revenues;
drop policy if exists "revenues_insert_scoped" on public.revenues;
drop policy if exists "revenues_update_scoped" on public.revenues;
drop policy if exists "revenues_delete_scoped" on public.revenues;
create policy "revenues_select_scoped"
  on public.revenues
  for select
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenues.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "revenues_insert_scoped"
  on public.revenues
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenues.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "revenues_update_scoped"
  on public.revenues
  for update
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenues.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenues.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "revenues_delete_scoped"
  on public.revenues
  for delete
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = revenues.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "expenses_select_scoped" on public.expenses;
drop policy if exists "expenses_insert_scoped" on public.expenses;
drop policy if exists "expenses_update_scoped" on public.expenses;
drop policy if exists "expenses_delete_scoped" on public.expenses;
create policy "expenses_select_scoped"
  on public.expenses
  for select
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expenses.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "expenses_insert_scoped"
  on public.expenses
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = expenses.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "expenses_update_scoped"
  on public.expenses
  for update
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expenses.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expenses.workspace_id
        and wm.user_id = auth.uid()
    )
  );
create policy "expenses_delete_scoped"
  on public.expenses
  for delete
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1 from public.workspace_memberships wm
      where wm.workspace_id = expenses.workspace_id
        and wm.user_id = auth.uid()
    )
  );
