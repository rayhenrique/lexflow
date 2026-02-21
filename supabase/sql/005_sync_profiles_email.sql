update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id
  and p.email is distinct from u.email;

create or replace function public.sync_profile_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where user_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_sync_profile_email_from_auth on auth.users;
create trigger trg_sync_profile_email_from_auth
after insert or update of email on auth.users
for each row
execute function public.sync_profile_email_from_auth();
