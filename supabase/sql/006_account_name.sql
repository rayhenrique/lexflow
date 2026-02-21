alter table public.profiles
  add column if not exists name text;

update public.profiles p
set name = coalesce(
  nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
  split_part(coalesce(u.email, ''), '@', 1)
)
from auth.users u
where p.user_id = u.id
  and (p.name is null or length(trim(p.name)) = 0);
