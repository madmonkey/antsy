-- Astro-style rows: no feature columns. Reference data for the adoption rehearsal (quickstart section 6).
-- astro_adoption.test.sql inserts equivalent rows itself.

insert into public.topics (id, name, slug, is_active) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Astro Active', 'astro-active', true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Astro Inactive', 'astro-inactive', false);

insert into public.content_items (id, topic_id, title, slug, body, is_active) values
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Astro One', 'astro-one', 'body one', true),
  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Astro Two', 'astro-two', 'body two', false);
