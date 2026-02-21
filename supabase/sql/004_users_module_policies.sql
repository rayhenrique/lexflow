alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and p.email is distinct from u.email;

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
