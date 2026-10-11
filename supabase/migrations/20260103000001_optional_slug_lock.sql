-- OPTIONAL, CHANGES ASTRO'S BEHAVIOR: once published_at is set, the slug can no longer change (spec FR-025).

create or replace function public.lock_published_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.published_at is not null and new.slug is distinct from old.slug then
    raise exception 'published addresses are permanent';
  end if;
  return new;
end;
$$;

drop trigger if exists topics_lock_published_slug on public.topics;
create trigger topics_lock_published_slug
before update on public.topics
for each row execute function public.lock_published_slug();

drop trigger if exists content_items_lock_published_slug on public.content_items;
create trigger content_items_lock_published_slug
before update on public.content_items
for each row execute function public.lock_published_slug();
