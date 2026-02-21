alter table if exists public.revenues
  add column if not exists status text not null default 'pendente';

alter table if exists public.expenses
  add column if not exists status text not null default 'pendente';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'revenues_status_check'
  ) then
    alter table public.revenues
      add constraint revenues_status_check
      check (status in ('pendente', 'pago', 'cancelado'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_status_check'
  ) then
    alter table public.expenses
      add constraint expenses_status_check
      check (status in ('pendente', 'pago', 'cancelado'));
  end if;
end
$$;
