-- Feature columns (REQUIRED for Astro adoption). Additive and re-runnable.
-- Astro's RLS policies and table-level grants already cover the new columns.

alter table public.topics
  add column if not exists description text not null default '',
  add column if not exists is_previewable boolean not null default false,
  add column if not exists published_at timestamptz;

alter table public.content_items
  add column if not exists excerpt text not null default '',
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'content_items_excerpt_max_length'
  ) then
    alter table public.content_items
      add constraint content_items_excerpt_max_length check (char_length(excerpt) <= 280);
  end if;
end
$$;

update public.topics set published_at = created_at
where is_active and published_at is null;

update public.content_items set published_at = created_at
where is_active and published_at is null;

create index if not exists content_items_topic_id_idx
  on public.content_items (topic_id);

create index if not exists content_items_published_at_active_idx
  on public.content_items (published_at desc) where is_active;
