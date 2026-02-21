create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role'
      and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('gestor', 'associado');
  else
    if exists (
      select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      join pg_enum e on e.enumtypid = t.oid
      where t.typname = 'app_role'
        and n.nspname = 'public'
        and e.enumlabel = 'gestora'
    ) and not exists (
      select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      join pg_enum e on e.enumtypid = t.oid
      where t.typname = 'app_role'
        and n.nspname = 'public'
        and e.enumlabel = 'gestor'
    ) then
      alter type public.app_role rename value 'gestora' to 'gestor';
    end if;
  end if;
end
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_matrix boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  role public.app_role not null,
  default_workspace_id uuid references public.workspaces (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, workspace_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type text not null check (type in ('receita', 'despesa')),
  amount numeric(14, 2) not null check (amount >= 0),
  status text not null check (status in ('pago', 'pendente', 'atrasado')),
  occurred_on date not null default current_date,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_memberships_user_id
  on public.workspace_memberships (user_id);

create index if not exists idx_workspace_memberships_workspace_id
  on public.workspace_memberships (workspace_id);

create index if not exists idx_transactions_workspace_id
  on public.transactions (workspace_id);

create index if not exists idx_transactions_occurred_on
  on public.transactions (occurred_on);

create or replace function public.is_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role::text = 'gestor'
  );
$$;

revoke all on function public.is_gestor() from public;
grant execute on function public.is_gestor() to authenticated;

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_scoped" on public.profiles;
drop policy if exists "profiles_update_scoped" on public.profiles;
create policy "profiles_select_scoped"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_gestor());
create policy "profiles_update_scoped"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id or public.is_gestor())
  with check (auth.uid() = user_id or public.is_gestor());

drop policy if exists "workspace_memberships_select_scoped" on public.workspace_memberships;
drop policy if exists "workspace_memberships_insert_gestor" on public.workspace_memberships;
drop policy if exists "workspace_memberships_update_gestor" on public.workspace_memberships;
drop policy if exists "workspace_memberships_delete_gestor" on public.workspace_memberships;
create policy "workspace_memberships_select_scoped"
  on public.workspace_memberships
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_gestor()
  );
create policy "workspace_memberships_insert_gestor"
  on public.workspace_memberships
  for insert
  to authenticated
  with check (public.is_gestor());
create policy "workspace_memberships_update_gestor"
  on public.workspace_memberships
  for update
  to authenticated
  using (public.is_gestor())
  with check (public.is_gestor());
create policy "workspace_memberships_delete_gestor"
  on public.workspace_memberships
  for delete
  to authenticated
  using (public.is_gestor());

drop policy if exists "workspaces_select_scoped" on public.workspaces;
create policy "workspaces_select_scoped"
  on public.workspaces
  for select
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "transactions_select_scoped" on public.transactions;
create policy "transactions_select_scoped"
  on public.transactions
  for select
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = transactions.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop policy if exists "transactions_insert_scoped" on public.transactions;
create policy "transactions_insert_scoped"
  on public.transactions
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_gestor()
      or exists (
        select 1
        from public.workspace_memberships wm
        where wm.workspace_id = transactions.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );

drop policy if exists "transactions_update_scoped" on public.transactions;
create policy "transactions_update_scoped"
  on public.transactions
  for update
  to authenticated
  using (
    public.is_gestor()
    or exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = transactions.workspace_id
        and wm.user_id = auth.uid()
    )
  )
  with check (
    public.is_gestor()
    or exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = transactions.workspace_id
        and wm.user_id = auth.uid()
    )
  );

