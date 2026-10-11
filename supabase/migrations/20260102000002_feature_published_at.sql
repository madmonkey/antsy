-- Stamps published_at once, on first activation (insert or update). Never clears it.
-- REQUIRED for Astro adoption.

create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.published_at is not null then
    new.published_at = old.published_at;
  elsif new.is_active and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists topics_stamp_published_at on public.topics;
create trigger topics_stamp_published_at
before insert or update on public.topics
for each row execute function public.stamp_published_at();

drop trigger if exists content_items_stamp_published_at on public.content_items;
create trigger content_items_stamp_published_at
before insert or update on public.content_items
for each row execute function public.stamp_published_at();
