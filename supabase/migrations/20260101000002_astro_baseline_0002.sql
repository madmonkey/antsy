alter table public.administrator_profiles enable row level security;
alter table public.topics enable row level security;
alter table public.content_items enable row level security;

revoke all on table public.administrator_profiles from anon, authenticated;
revoke all on table public.topics from anon, authenticated;
revoke all on table public.content_items from anon, authenticated;

grant select on table public.administrator_profiles to authenticated;
grant select on table public.topics to anon, authenticated;
grant select, insert, update on table public.topics to authenticated;
grant select on table public.content_items to anon, authenticated;
grant select, insert, update on table public.content_items to authenticated;

create or replace function public.is_administrator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.administrator_profiles
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_administrator() from public;
grant execute on function public.is_administrator() to authenticated;

create policy "Authenticated users can read their administrator profile"
on public.administrator_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Visitors can read active topics"
on public.topics
for select
to anon, authenticated
using (is_active);

create policy "Administrators can read all topics"
on public.topics
for select
to authenticated
using ((select public.is_administrator()));

create policy "Administrators can create topics"
on public.topics
for insert
to authenticated
with check ((select public.is_administrator()));

create policy "Administrators can update topics"
on public.topics
for update
to authenticated
using ((select public.is_administrator()))
with check ((select public.is_administrator()));

create policy "Visitors can read active content in active topics"
on public.content_items
for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.topics
    where id = topic_id
      and is_active
  )
);

create policy "Administrators can read all content"
on public.content_items
for select
to authenticated
using ((select public.is_administrator()));

create policy "Administrators can create content"
on public.content_items
for insert
to authenticated
with check ((select public.is_administrator()));

create policy "Administrators can update content"
on public.content_items
for update
to authenticated
using ((select public.is_administrator()))
with check ((select public.is_administrator()));
