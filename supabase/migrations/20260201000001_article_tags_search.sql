-- Article tags and full-text search. Additive and re-runnable.

alter table public.content_items add column if not exists tags text[] not null default '{}';
alter table public.content_items add column if not exists search_vector tsvector;

create or replace function public.content_items_tags_search()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  cleaned text[];
begin
  select coalesce(array_agg(t order by t), '{}') into cleaned
  from (
    select distinct lower(btrim(regexp_replace(x, '\s+', ' ', 'g'))) as t
    from unnest(coalesce(new.tags, '{}')) as x
  ) s
  where t <> '';

  if cardinality(cleaned) > 20 then
    raise exception 'At most 20 tags per article.';
  end if;
  if exists (select 1 from unnest(cleaned) t where char_length(t) > 30 or position(',' in t) > 0) then
    raise exception 'Each tag must be 1-30 characters and must not contain a comma.';
  end if;
  new.tags := cleaned;

  -- Embedded base64 images would exceed the tsvector size limit, so strip them first.
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(new.tags, ' ')), 'B') ||
    setweight(to_tsvector('english',
      regexp_replace(coalesce(new.body, ''), 'data:image/[^)\s"'']+', '', 'g')), 'C');
  return new;
end;
$$;

drop trigger if exists content_items_tags_search on public.content_items;
create trigger content_items_tags_search
  before insert or update of title, body, tags on public.content_items
  for each row execute function public.content_items_tags_search();

create index if not exists content_items_tags_idx on public.content_items using gin (tags);
create index if not exists content_items_search_idx on public.content_items using gin (search_vector);

update public.content_items set tags = tags;

create or replace function public.list_tags()
returns table (tag text, article_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select t as tag, count(*) as article_count
  from public.content_items c
  join public.topics tp on tp.id = c.topic_id
  cross join lateral unnest(c.tags) as t
  where c.is_active and c.published_at is not null and tp.is_active
  group by t
  order by count(*) desc, t
$$;

create or replace function public.search_articles(
  q text default null,
  tag_filter text[] default '{}',
  max_rows int default 50
)
returns table (
  id uuid, title text, slug text, excerpt text, published_at timestamptz,
  tags text[], topic_name text, topic_slug text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  query_text text := left(btrim(coalesce(q, '')), 200);
  wanted text[] := coalesce(tag_filter, '{}');
  tsq tsquery;
begin
  if query_text = '' and cardinality(wanted) = 0 then
    return;
  end if;
  if query_text <> '' then
    tsq := websearch_to_tsquery('english', query_text);
  end if;

  return query
  select c.id, c.title, c.slug, c.excerpt, c.published_at, c.tags, tp.name, tp.slug
  from public.content_items c
  join public.topics tp on tp.id = c.topic_id
  where c.is_active and c.published_at is not null and tp.is_active
    and (cardinality(wanted) = 0 or c.tags @> wanted)
    and (query_text = '' or c.search_vector @@ tsq)
  order by
    case when query_text = '' then 0 else ts_rank(c.search_vector, tsq) end desc,
    c.published_at desc
  limit least(greatest(coalesce(max_rows, 50), 1), 50);
end;
$$;

revoke all on function public.list_tags() from public;
revoke all on function public.search_articles(text, text[], int) from public;
grant execute on function public.list_tags() to anon, authenticated;
grant execute on function public.search_articles(text, text[], int) to anon, authenticated;
