do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'public'
      and t.typname = 'app_role'
      and e.enumlabel = 'operador'
  ) then
    alter type public.app_role add value 'operador';
  end if;
end
$$;

create or replace function public.is_operador()
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
      and p.role::text = 'operador'
  );
$$;

revoke all on function public.is_operador() from public;
grant execute on function public.is_operador() to authenticated;

drop policy if exists "revenue_classifications_select_scoped" on public.revenue_classifications;
drop policy if exists "revenue_classifications_insert_scoped" on public.revenue_classifications;
drop policy if exists "revenue_classifications_update_scoped" on public.revenue_classifications;
drop policy if exists "revenue_classifications_delete_scoped" on public.revenue_classifications;
create policy "revenue_classifications_select_scoped"
  on public.revenue_classifications
  for select
  to authenticated
  using (
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenue_classifications.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "revenue_classifications_insert_scoped"
  on public.revenue_classifications
  for insert
  to authenticated
  with check (
    not public.is_operador()
    and created_by = auth.uid()
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
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenue_classifications.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  )
  with check (
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenue_classifications.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "revenue_classifications_delete_scoped"
  on public.revenue_classifications
  for delete
  to authenticated
  using (
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenue_classifications.workspace_id
          and wm.user_id = auth.uid()
      )
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
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenues.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "revenues_insert_scoped"
  on public.revenues
  for insert
  to authenticated
  with check (
    not public.is_operador()
    and created_by = auth.uid()
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
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenues.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  )
  with check (
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenues.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
create policy "revenues_delete_scoped"
  on public.revenues
  for delete
  to authenticated
  using (
    not public.is_operador()
    and (
      public.is_gestor()
      or exists (
        select 1 from public.workspace_memberships wm
        where wm.workspace_id = revenues.workspace_id
          and wm.user_id = auth.uid()
      )
    )
  );
