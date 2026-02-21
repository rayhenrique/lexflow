insert into public.workspaces (id, name, slug, is_matrix)
values
  ('11111111-1111-4111-8111-111111111111', 'Matriz', 'matriz', true),
  ('44444444-4444-4444-8444-444444444444', 'Cível - Família', 'civel-familia', false),
  ('55555555-5555-4555-8555-555555555555', 'Cível - Consumidor', 'civel-consumidor', false),
  ('66666666-6666-4666-8666-666666666666', 'Cível - Geral', 'civel-geral', false),
  ('77777777-7777-4777-8777-777777777777', 'Previdenciário', 'previdenciario', false),
  ('22222222-2222-4222-8222-222222222222', 'Trabalhista', 'trabalhista', false),
  ('33333333-3333-4333-8333-333333333333', 'Criminal', 'criminal', false)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  is_matrix = excluded.is_matrix;

with selected_users as (
  select
    (
      select id
      from auth.users
      where email = 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ) as gestor_id,
    (
      select id
      from auth.users
      where email <> 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ) as associado_id
)
insert into public.profiles (user_id, role, default_workspace_id)
select
  selected_users.gestor_id,
  'gestor'::public.app_role,
  '11111111-1111-4111-8111-111111111111'::uuid
from selected_users
where selected_users.gestor_id is not null
on conflict (user_id) do update
set
  role = excluded.role,
  default_workspace_id = excluded.default_workspace_id;

with selected_users as (
  select
    (
      select id
      from auth.users
      where email = 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ) as gestor_id,
    (
      select id
      from auth.users
      where email <> 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ) as associado_id
)
insert into public.profiles (user_id, role, default_workspace_id)
select
  selected_users.associado_id,
  'associado'::public.app_role,
  '22222222-2222-4222-8222-222222222222'::uuid
from selected_users
where selected_users.associado_id is not null
on conflict (user_id) do update
set
  role = excluded.role,
  default_workspace_id = excluded.default_workspace_id;

with selected_users as (
  select
    (
      select id
      from auth.users
      where email = 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ) as gestor_id,
    (
      select id
      from auth.users
      where email <> 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ) as associado_id
)
insert into public.workspace_memberships (user_id, workspace_id)
select
  selected_users.gestor_id,
  workspace.id
from selected_users
cross join public.workspaces workspace
where selected_users.gestor_id is not null
on conflict (user_id, workspace_id) do nothing;

with selected_users as (
  select
    (
      select id
      from auth.users
      where email <> 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ) as associado_id
)
insert into public.workspace_memberships (user_id, workspace_id)
select
  selected_users.associado_id,
  '22222222-2222-4222-8222-222222222222'::uuid
from selected_users
where selected_users.associado_id is not null
on conflict (user_id, workspace_id) do nothing;

with seed_actor as (
  select coalesce(
    (
      select id
      from auth.users
      where email = 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ),
    (
      select id
      from auth.users
      order by created_at nulls last, id
      limit 1
    )
  ) as id
)
insert into public.transactions (id, workspace_id, type, amount, status, occurred_on, created_by)
select
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  'receita',
  15000.00,
  'pago',
  current_date - interval '4 days',
  seed_actor.id
from seed_actor
on conflict (id) do update
set
  amount = excluded.amount,
  status = excluded.status,
  occurred_on = excluded.occurred_on;

with seed_actor as (
  select coalesce(
    (
      select id
      from auth.users
      where email = 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ),
    (
      select id
      from auth.users
      order by created_at nulls last, id
      limit 1
    )
  ) as id
)
insert into public.transactions (id, workspace_id, type, amount, status, occurred_on, created_by)
select
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  'despesa',
  4200.00,
  'pago',
  current_date - interval '3 days',
  seed_actor.id
from seed_actor
on conflict (id) do update
set
  amount = excluded.amount,
  status = excluded.status,
  occurred_on = excluded.occurred_on;

with seed_actor as (
  select coalesce(
    (
      select id
      from auth.users
      where email = 'rayhenrique@gmail.com'
      order by created_at nulls last, id
      limit 1
    ),
    (
      select id
      from auth.users
      order by created_at nulls last, id
      limit 1
    )
  ) as id
)
insert into public.transactions (id, workspace_id, type, amount, status, occurred_on, created_by)
select
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  'despesa',
  1800.00,
  'atrasado',
  current_date - interval '1 day',
  seed_actor.id
from seed_actor
on conflict (id) do update
set
  amount = excluded.amount,
  status = excluded.status,
  occurred_on = excluded.occurred_on;
