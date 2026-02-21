create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_table_name on public.audit_logs (table_name);
create index if not exists idx_audit_logs_action on public.audit_logs (action);
create index if not exists idx_audit_logs_workspace_id on public.audit_logs (workspace_id);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_gestor" on public.audit_logs;
create policy "audit_logs_select_gestor"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_gestor());

drop policy if exists "audit_logs_insert_blocked" on public.audit_logs;
create policy "audit_logs_insert_blocked"
  on public.audit_logs
  for insert
  to authenticated
  with check (false);

drop policy if exists "audit_logs_update_blocked" on public.audit_logs;
create policy "audit_logs_update_blocked"
  on public.audit_logs
  for update
  to authenticated
  using (false);

drop policy if exists "audit_logs_delete_blocked" on public.audit_logs;
create policy "audit_logs_delete_blocked"
  on public.audit_logs
  for delete
  to authenticated
  using (false);

create or replace function public.log_audit_action()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  current_workspace_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    current_user_id := case
      when TG_OP = 'DELETE' then OLD.created_by
      else NEW.created_by
    end;
  end if;

  if TG_OP = 'INSERT' then
    current_workspace_id := NEW.workspace_id;

    insert into public.audit_logs (workspace_id, table_name, record_id, action, new_data, user_id)
    values (
      current_workspace_id,
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      row_to_json(NEW)::jsonb,
      current_user_id
    );

    return NEW;
  elsif TG_OP = 'UPDATE' then
    current_workspace_id := NEW.workspace_id;

    insert into public.audit_logs (
      workspace_id,
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      user_id
    )
    values (
      current_workspace_id,
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      row_to_json(OLD)::jsonb,
      row_to_json(NEW)::jsonb,
      current_user_id
    );

    return NEW;
  elsif TG_OP = 'DELETE' then
    current_workspace_id := OLD.workspace_id;

    insert into public.audit_logs (workspace_id, table_name, record_id, action, old_data, user_id)
    values (
      current_workspace_id,
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      row_to_json(OLD)::jsonb,
      current_user_id
    );

    return OLD;
  end if;

  return null;
end;
$$;

drop trigger if exists audit_revenues_trigger on public.revenues;
create trigger audit_revenues_trigger
after insert or update or delete on public.revenues
for each row execute function public.log_audit_action();

drop trigger if exists audit_expenses_trigger on public.expenses;
create trigger audit_expenses_trigger
after insert or update or delete on public.expenses
for each row execute function public.log_audit_action();

drop trigger if exists audit_clients_trigger on public.clients;
create trigger audit_clients_trigger
after insert or update or delete on public.clients
for each row execute function public.log_audit_action();
