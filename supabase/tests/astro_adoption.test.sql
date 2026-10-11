begin;
select plan(10);

-- Baseline plus exactly the feature additions, nothing else.
select columns_are('public', 'topics',
  array['id','name','slug','is_active','created_at','updated_at','description','is_previewable','published_at'],
  'topics = baseline + feature columns only');
select columns_are('public', 'content_items',
  array['id','topic_id','title','slug','body','is_active','created_at','updated_at','excerpt','published_at'],
  'content_items = baseline + feature columns only');

-- Baseline policies untouched (5 topics + 5 content_items + 1 administrator_profiles = 11).
select is((select count(*)::int from pg_policies where schemaname = 'public'), 11,
  'policy count equals the baseline');
select policies_are('public', 'topics', array[
  'Visitors can read active topics','Administrators can read all topics','Administrators can create topics',
  'Administrators can update topics','Administrators can delete topics']);
select policies_are('public', 'content_items', array[
  'Visitors can read active content in active topics','Administrators can read all content',
  'Administrators can create content','Administrators can update content','Administrators can delete content']);

-- Astro-style inserts (no feature columns) still succeed and get defaults.
insert into public.topics (id, name, slug, is_active) values
    ('bbbbbbbb-0000-0000-0000-000000000001', 'Astro Active', 'astro-active', true),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'Astro Inactive', 'astro-inactive', false);
insert into public.content_items (id, topic_id, title, slug, body, is_active) values
    ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Astro One', 'astro-one', 'body one', true),
    ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Astro Two', 'astro-two', 'body two', false);
select pass('Astro-style inserts without feature columns succeed');

select is((select description from public.topics where slug = 'astro-active'), '', 'description defaults to empty');
select is((select is_previewable from public.topics where slug = 'astro-active'), false, 'is_previewable defaults to false');
select is((select excerpt from public.content_items where slug = 'astro-one'), '', 'excerpt defaults to empty');
select is((select (published_at is not null, title, body)::text from public.content_items where slug = 'astro-one'),
  '(t,"Astro One","body one")', 'existing columns unchanged; active row stamped');

select * from finish();
rollback;

