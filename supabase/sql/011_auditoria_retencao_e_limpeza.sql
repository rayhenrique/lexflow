-- Permite limpeza manual apenas da janela intermediária (30 a 90 dias)
drop policy if exists "audit_logs_delete_blocked" on public.audit_logs;
drop policy if exists "audit_logs_delete_older_than_30_days" on public.audit_logs;

create policy "audit_logs_delete_older_than_30_days"
  on public.audit_logs
  for delete
  to authenticated
  using (
    public.is_gestor()
    and created_at < now() - interval '30 days'
    and created_at >= now() - interval '90 days'
  );

-- Limpeza automática de segurança para tudo que ultrapassar 90 dias.
create extension if not exists pg_cron;

create or replace function public.auto_cleanup_audit_logs()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.audit_logs
  where created_at < now() - interval '90 days';
$$;

do $do$
declare
  scheduled_job_id bigint;
begin
  for scheduled_job_id in
    select jobid
    from cron.job
    where jobname = 'cleanup-90-days-logs'
  loop
    perform cron.unschedule(scheduled_job_id);
  end loop;

  perform cron.schedule(
    'cleanup-90-days-logs',
    '0 3 * * *',
    $cron$ select public.auto_cleanup_audit_logs(); $cron$
  );
end
$do$;
