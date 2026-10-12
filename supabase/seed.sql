-- Local only. Never applied to the hosted project.
-- Admin login: admin@example.test / local-admin-password

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'admin@example.test',
  extensions.crypt('local-admin-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@example.test"}',
  'email', now(), now(), now()
);

-- A signed-up user who is NOT an administrator: user@example.test / local-user-password
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000',
  '33333333-3333-3333-3333-333333333333',
  'authenticated', 'authenticated', 'user@example.test',
  extensions.crypt('local-user-password', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  '33333333-3333-3333-3333-333333333333',
  '{"sub":"33333333-3333-3333-3333-333333333333","email":"user@example.test"}',
  'email', now(), now(), now()
);

insert into public.administrator_profiles (user_id)
values ('11111111-1111-1111-1111-111111111111');

insert into public.topics (id, name, slug, description, is_previewable, is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Engineering', 'engineering', 'Notes from the build.', true, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Drafts', 'drafts', 'Not yet public.', false, false);

insert into public.content_items (topic_id, title, slug, excerpt, body, is_active) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Hello world', 'hello-world', 'The first post.', E'# Hello\n\nThe first post.', true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Second post', 'second-post', 'Another one.', E'# Second\n\nAnother one.', true),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Hidden draft', 'hidden-draft', '', E'# Draft\n\nNot public.', false),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'In inactive topic', 'in-inactive-topic', '', E'# Hidden\n\nTopic is inactive.', true);
