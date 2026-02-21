create table if not exists public.firm_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000000'::uuid,
  name text,
  cnpj text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  updated_at timestamptz not null default now()
);

insert into public.firm_settings (id, name)
values ('00000000-0000-0000-0000-000000000000', 'Meu Escritório')
on conflict (id) do nothing;

alter table public.firm_settings enable row level security;

drop policy if exists "firm_settings_select" on public.firm_settings;
create policy "firm_settings_select"
  on public.firm_settings
  for select
  to authenticated
  using (true);

drop policy if exists "firm_settings_update" on public.firm_settings;
create policy "firm_settings_update"
  on public.firm_settings
  for update
  to authenticated
  using (public.is_gestor())
  with check (public.is_gestor());

drop policy if exists "firm_settings_insert" on public.firm_settings;
create policy "firm_settings_insert"
  on public.firm_settings
  for insert
  to authenticated
  with check (public.is_gestor());

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "Logos_Public_Read" on storage.objects;
create policy "Logos_Public_Read"
  on storage.objects
  for select
  using (bucket_id = 'logos');

drop policy if exists "Logos_Gestor_Insert" on storage.objects;
create policy "Logos_Gestor_Insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'logos' and public.is_gestor());

drop policy if exists "Logos_Gestor_Update" on storage.objects;
create policy "Logos_Gestor_Update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'logos' and public.is_gestor())
  with check (bucket_id = 'logos' and public.is_gestor());

drop policy if exists "Logos_Gestor_Delete" on storage.objects;
create policy "Logos_Gestor_Delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'logos' and public.is_gestor());
