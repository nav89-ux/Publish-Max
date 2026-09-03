alter table public.profiles
add constraint profiles_display_name_length check (
  display_name is null or char_length(display_name) between 1 and 80
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  signup_username text;
  signup_display_name text;
begin
  signup_username := lower(nullif(trim(new.raw_user_meta_data ->> 'username'), ''));
  signup_display_name := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');

  if signup_username is not null and signup_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'Invalid username';
  end if;
  if signup_display_name is not null and char_length(signup_display_name) > 80 then
    raise exception 'Invalid display name';
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, signup_username, signup_display_name);
  return new;
end;
$$;
