do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'app_role'
      and e.enumlabel = 'gestora'
  ) then
    alter type public.app_role rename value 'gestora' to 'gestor';
  end if;
end
$$;

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
      and p.role = 'gestor'::public.app_role
  );
$$;

revoke all on function public.is_gestor() from public;
grant execute on function public.is_gestor() to authenticated;

drop policy if exists "workspace_memberships_select_scoped" on public.workspace_memberships;
create policy "workspace_memberships_select_scoped"
  on public.workspace_memberships
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.is_gestor()
  );

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

drop function if exists public.is_gestora();
