insert into public.workspaces (name, slug, is_matrix)
values ('Empresarial', 'empresarial', false)
on conflict (slug) do update
set name = excluded.name;
