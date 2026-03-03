alter table public.revenues
  add column if not exists paid_on date,
  add column if not exists canceled_at timestamptz,
  add column if not exists canceled_reason text;

alter table public.expenses
  add column if not exists paid_on date,
  add column if not exists canceled_at timestamptz,
  add column if not exists canceled_reason text;

update public.revenues
set paid_on = occurred_on
where status = 'pago' and paid_on is null;

update public.expenses
set paid_on = occurred_on
where status = 'pago' and paid_on is null;

alter table public.revenues
  drop constraint if exists revenues_status_paid_on_ck;
alter table public.revenues
  add constraint revenues_status_paid_on_ck
  check (
    (status = 'pago' and paid_on is not null)
    or (status <> 'pago' and paid_on is null)
  );

alter table public.expenses
  drop constraint if exists expenses_status_paid_on_ck;
alter table public.expenses
  add constraint expenses_status_paid_on_ck
  check (
    (status = 'pago' and paid_on is not null)
    or (status <> 'pago' and paid_on is null)
  );

alter table public.revenues
  drop constraint if exists revenues_status_canceled_at_ck;
alter table public.revenues
  add constraint revenues_status_canceled_at_ck
  check (
    (status = 'cancelado' and canceled_at is not null)
    or (status <> 'cancelado' and canceled_at is null)
  );

alter table public.expenses
  drop constraint if exists expenses_status_canceled_at_ck;
alter table public.expenses
  add constraint expenses_status_canceled_at_ck
  check (
    (status = 'cancelado' and canceled_at is not null)
    or (status <> 'cancelado' and canceled_at is null)
  );

create index if not exists idx_revenues_workspace_status_occurred_on
  on public.revenues (workspace_id, status, occurred_on desc);

create index if not exists idx_expenses_workspace_status_occurred_on
  on public.expenses (workspace_id, status, occurred_on desc);

create index if not exists idx_revenues_workspace_paid_on
  on public.revenues (workspace_id, paid_on desc);

create index if not exists idx_expenses_workspace_paid_on
  on public.expenses (workspace_id, paid_on desc);
