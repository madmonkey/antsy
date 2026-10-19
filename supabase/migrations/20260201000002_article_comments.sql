-- Moderated article comments. Additive and re-runnable.
-- shortcut: rate limit and approval are the only spam controls besides the sign-up captcha, add a stricter filter if spam appears.

alter table public.content_items add column if not exists comments_enabled boolean not null default true;

create or replace function public.is_verified_reader()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null
  )
$$;
revoke all on function public.is_verified_reader() from public, anon;
grant execute on function public.is_verified_reader() to authenticated;

create table if not exists public.commenter_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commenter_display_name_len check (char_length(display_name) between 2 and 40 and display_name = btrim(display_name))
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  author_name text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_body_len check (char_length(body) between 1 and 2000 and body = btrim(body))
);

create index if not exists comments_article_idx on public.comments (content_item_id, status, created_at);
create index if not exists comments_pending_idx on public.comments (status, created_at) where status = 'pending';

drop trigger if exists commenter_profiles_updated_at on public.commenter_profiles;
create trigger commenter_profiles_updated_at before update on public.commenter_profiles
  for each row execute function public.set_updated_at();
drop trigger if exists comments_updated_at on public.comments;
create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

-- Trim names so the length check sees what is stored.
create or replace function public.commenter_profiles_trim()
returns trigger language plpgsql as $$
begin
  new.display_name := btrim(new.display_name);
  if tg_op = 'UPDATE' and new.is_blocked is distinct from old.is_blocked and not public.is_administrator() then
    raise exception 'Only administrators can change the blocked flag.';
  end if;
  if tg_op = 'INSERT' and not public.is_administrator() then
    new.is_blocked := false;
  end if;
  return new;
end;
$$;
drop trigger if exists commenter_profiles_trim on public.commenter_profiles;
create trigger commenter_profiles_trim before insert or update on public.commenter_profiles
  for each row execute function public.commenter_profiles_trim();

-- Runs before the row-level policy so readers get a readable reason.
create or replace function public.comments_before_insert()
returns trigger language plpgsql as $$
declare
  profile public.commenter_profiles;
  enabled boolean;
begin
  select * into profile from public.commenter_profiles where user_id = new.user_id;
  if not found then
    raise exception 'Choose a display name before commenting.';
  end if;
  if profile.is_blocked then
    raise exception 'You are blocked from commenting.';
  end if;
  select comments_enabled into enabled from public.content_items where id = new.content_item_id;
  if enabled is distinct from true then
    raise exception 'Commenting is closed on this article.';
  end if;
  if (select count(*) from public.comments where user_id = new.user_id and created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.comments where user_id = new.user_id and status = 'pending') >= 20 then
    raise exception 'Too many comments. Try again shortly.';
  end if;
  new.body := btrim(new.body);
  new.author_name := profile.display_name;
  return new;
end;
$$;
drop trigger if exists comments_before_insert on public.comments;
create trigger comments_before_insert before insert on public.comments
  for each row execute function public.comments_before_insert();

create or replace function public.comments_before_update()
returns trigger language plpgsql as $$
begin
  if not public.is_administrator() and (
    new.status is distinct from old.status or new.body is distinct from old.body
    or new.user_id is distinct from old.user_id or new.content_item_id is distinct from old.content_item_id
    or new.author_name is distinct from old.author_name
  ) then
    raise exception 'Comments can only be changed by an administrator.';
  end if;
  return new;
end;
$$;
drop trigger if exists comments_before_update on public.comments;
create trigger comments_before_update before update on public.comments
  for each row execute function public.comments_before_update();

alter table public.commenter_profiles enable row level security;
alter table public.comments enable row level security;

drop policy if exists profiles_select on public.commenter_profiles;
drop policy if exists profiles_insert on public.commenter_profiles;
drop policy if exists profiles_update on public.commenter_profiles;
create policy profiles_select on public.commenter_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_administrator());
create policy profiles_insert on public.commenter_profiles for insert to authenticated
  with check (user_id = auth.uid() and public.is_verified_reader() and is_blocked = false);
create policy profiles_update on public.commenter_profiles for update to authenticated
  using (user_id = auth.uid() or public.is_administrator())
  with check (user_id = auth.uid() or public.is_administrator());

drop policy if exists comments_select_public on public.comments;
drop policy if exists comments_select_own on public.comments;
drop policy if exists comments_select_admin on public.comments;
drop policy if exists comments_insert on public.comments;
drop policy if exists comments_update_admin on public.comments;
drop policy if exists comments_delete on public.comments;
create policy comments_select_public on public.comments for select to anon, authenticated
  using (status = 'approved' and exists (select 1 from public.content_items c where c.id = content_item_id));
create policy comments_select_own on public.comments for select to authenticated
  using (user_id = auth.uid());
create policy comments_select_admin on public.comments for select to authenticated
  using (public.is_administrator());
create policy comments_insert on public.comments for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'pending' and public.is_verified_reader()
    and exists (select 1 from public.commenter_profiles p where p.user_id = auth.uid() and not p.is_blocked)
    and exists (select 1 from public.content_items c where c.id = content_item_id and c.comments_enabled)
  );
create policy comments_update_admin on public.comments for update to authenticated
  using (public.is_administrator()) with check (public.is_administrator());
create policy comments_delete on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_administrator());

revoke all on public.commenter_profiles from anon;
revoke all on public.comments from anon;
grant select on public.comments to anon;
grant select, insert, update on public.commenter_profiles to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
