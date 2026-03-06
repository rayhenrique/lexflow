with creator as (
  select p.user_id
  from public.profiles p
  order by
    case when p.role::text = 'gestor' then 0 else 1 end,
    p.created_at asc
  limit 1
),
categorias(name, description) as (
  values
    ('Congressos', 'Categoria de despesa: Congressos'),
    ('Mentoria', 'Categoria de despesa: Mentoria'),
    ('Cursos', 'Categoria de despesa: Cursos'),
    ('Viagem', 'Categoria de despesa: Viagem'),
    ('Combustível', 'Categoria de despesa: Combustível'),
    ('Alimentação', 'Categoria de despesa: Alimentação'),
    ('Água', 'Categoria de despesa: Água'),
    ('Hotel', 'Categoria de despesa: Hotel'),
    ('Energia', 'Categoria de despesa: Energia'),
    ('Internet', 'Categoria de despesa: Internet'),
    ('Funcionários', 'Categoria de despesa: Funcionários'),
    ('Segurança', 'Categoria de despesa: Segurança'),
    ('Aluguel', 'Categoria de despesa: Aluguel'),
    ('Exames', 'Categoria de despesa: Exames'),
    ('Consultas', 'Categoria de despesa: Consultas'),
    ('Transporte', 'Categoria de despesa: Transporte'),
    ('Colaborador', 'Categoria de despesa: Colaborador'),
    ('Material de Limpeza', 'Categoria de despesa: Material de Limpeza'),
    ('Material de Escritório', 'Categoria de despesa: Material de Escritório'),
    ('Móveis', 'Categoria de despesa: Móveis'),
    ('Manutenção', 'Categoria de despesa: Manutenção'),
    ('Prestação de Serviços', 'Categoria de despesa: Prestação de Serviços'),
    ('Equipamentos eletrônicos', 'Categoria de despesa: Equipamentos eletrônicos'),
    ('Brindes', 'Categoria de despesa: Brindes'),
    ('Confraternização', 'Categoria de despesa: Confraternização'),
    ('Férias', 'Categoria de despesa: Férias'),
    ('Outros', 'Categoria de despesa: Outros')
)
insert into public.expense_classifications (
  workspace_id,
  name,
  code,
  description,
  active,
  created_by
)
select
  w.id as workspace_id,
  c.name,
  '' as code,
  c.description,
  true as active,
  cr.user_id as created_by
from public.workspaces w
cross join categorias c
cross join creator cr
where not exists (
  select 1
  from public.expense_classifications ec
  where ec.workspace_id = w.id
    and lower(ec.name) = lower(c.name)
);
