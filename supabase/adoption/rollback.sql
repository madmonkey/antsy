-- Removes ONLY what the feature migrations added. Never run automatically.
-- Dropping columns discards their data (descriptions, excerpts, previewable flags, published dates).

drop trigger if exists topics_lock_published_slug on public.topics;
drop trigger if exists content_items_lock_published_slug on public.content_items;
drop function if exists public.lock_published_slug();

alter table public.content_items drop constraint if exists content_items_body_max_length;

drop trigger if exists topics_stamp_published_at on public.topics;
drop trigger if exists content_items_stamp_published_at on public.content_items;
drop function if exists public.stamp_published_at();

drop index if exists public.content_items_published_at_active_idx;
drop index if exists public.content_items_topic_id_idx;

alter table public.content_items drop constraint if exists content_items_excerpt_max_length;

alter table public.content_items
  drop column if exists excerpt,
  drop column if exists published_at;

alter table public.topics
  drop column if exists description,
  drop column if exists is_previewable,
  drop column if exists published_at;
