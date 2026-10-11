begin;
select plan(16);

-- fixtures (as postgres)
insert into auth.users (id, aud, role, email) values
  ('21111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin-t@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'user-t@example.test');
insert into public.administrator_profiles (user_id) values ('21111111-1111-1111-1111-111111111111');

insert into public.topics (id, name, slug, is_active) values
  ('dddddddd-0000-0000-0000-000000000001', 'T Active', 't-active', true),
  ('dddddddd-0000-0000-0000-000000000002', 'T Inactive', 't-inactive', false);
insert into public.content_items (id, topic_id, title, slug, body, is_active) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'Live', 't-live', 'x', true),
  ('eeeeeeee-0000-0000-0000-000000000002', 'dddddddd-0000-0000-0000-000000000001', 'Draft', 't-draft', 'x', false),
  ('eeeeeeee-0000-0000-0000-000000000003', 'dddddddd-0000-0000-0000-000000000002', 'Orphaned live', 't-orphan', 'x', true);

-- anon
set local role anon;
select is((select count(*)::int from public.topics where slug like 't-%'), 1, 'anon sees only active topics');
select is((select count(*)::int from public.content_items where slug like 't-%'), 1, 'anon sees only active articles in active topics');

-- non-administrator
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$insert into public.topics (name, slug) values ('Nope', 'nope')$$,
  '42501', null, 'non-administrator cannot create a topic');
select lives_ok(
  $$update public.content_items set title = 'Hacked' where slug = 't-live'$$,
  'non-administrator update does not error');
reset role;
select is((select title from public.content_items where slug = 't-live'), 'Live',
  'non-administrator update changes nothing');

-- administrator
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"21111111-1111-1111-1111-111111111111","role":"authenticated"}';
select is((select count(*)::int from public.topics where slug like 't-%'), 2, 'administrator sees all topics');
select lives_ok(
  $$insert into public.content_items (topic_id, title, slug, body, is_active)
    values ('dddddddd-0000-0000-0000-000000000001', 'Born live', 't-born-live', 'x', true)$$,
  'administrator can create an article');
select isnt(
  (select published_at from public.content_items where slug = 't-born-live'), null,
  'article created already active gets published_at');

-- published_at never cleared
update public.content_items set is_active = false where slug = 't-born-live';
select isnt(
  (select published_at from public.content_items where slug = 't-born-live'), null,
  'published_at survives deactivation');
update public.content_items set published_at = null where slug = 't-born-live';
select isnt(
  (select published_at from public.content_items where slug = 't-born-live'), null,
  'published_at cannot be cleared');
update public.content_items set is_active = true where slug = 't-draft';
select isnt(
  (select published_at from public.content_items where slug = 't-draft'), null,
  'first activation stamps published_at');

-- slug lock
select throws_ok(
  $$update public.content_items set slug = 't-renamed' where slug = 't-born-live'$$,
  null, 'published addresses are permanent', 'slug change after publish is rejected');

-- limits
select throws_ok(
  $$insert into public.content_items (topic_id, title, slug, body, excerpt)
    values ('dddddddd-0000-0000-0000-000000000001', 'Long', 't-long-excerpt', 'x', repeat('e', 281))$$,
  '23514', null, 'over-280 excerpt is rejected');
select throws_ok(
  $$insert into public.content_items (topic_id, title, slug, body)
    values ('dddddddd-0000-0000-0000-000000000001', 'Huge', 't-huge', repeat('b', 7000001))$$,
  '23514', null, 'over-limit body is rejected');

-- cascade
select lives_ok($$delete from public.topics where slug = 't-active'$$, 'administrator can delete a topic');
select is((select count(*)::int from public.content_items where topic_id = 'dddddddd-0000-0000-0000-000000000001'),
  0, 'deleting a topic deletes its articles');

select * from finish();
rollback;
