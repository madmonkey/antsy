create table public.administrator_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_name_not_blank check (char_length(btrim(name)) > 0),
  constraint topics_name_is_trimmed check (name = btrim(name)),
  constraint topics_slug_is_url_safe check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create unique index topics_name_lower_key on public.topics (lower(name));

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics (id) on delete restrict,
  title text not null,
  slug text not null unique,
  body text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_items_title_not_blank check (char_length(btrim(title)) > 0),
  constraint content_items_title_is_trimmed check (title = btrim(title)),
  constraint content_items_body_not_blank check (char_length(btrim(body)) > 0),
  constraint content_items_slug_is_url_safe check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_at is distinct from old.created_at then
    raise exception 'created_at cannot be changed';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

create trigger administrator_profiles_set_updated_at
before update on public.administrator_profiles
for each row
execute function public.set_updated_at();

create trigger topics_set_updated_at
before update on public.topics
for each row
execute function public.set_updated_at();

create trigger content_items_set_updated_at
before update on public.content_items
for each row
execute function public.set_updated_at();
