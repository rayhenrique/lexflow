alter table if exists public.revenues
  add column if not exists client_id uuid references public.clients (id) on delete set null;

alter table if exists public.expenses
  add column if not exists client_id uuid references public.clients (id) on delete set null;

create index if not exists idx_revenues_client_id on public.revenues (client_id);
create index if not exists idx_expenses_client_id on public.expenses (client_id);
