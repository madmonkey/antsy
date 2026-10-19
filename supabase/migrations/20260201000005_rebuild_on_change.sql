-- Rebuilds the static site whenever articles or topics change, by sending a GitHub repository_dispatch.
-- Needs a GitHub token stored once in Vault (not in this repo):
--   select vault.create_secret('<token>', 'github_dispatch_token');
create extension if not exists pg_net with schema extensions;

create or replace function public.request_site_rebuild() returns trigger
language plpgsql security definer set search_path = public, extensions, vault as $$
declare
  token text;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name = 'github_dispatch_token' limit 1;
  if token is null then return null; end if;
  begin
    perform net.http_post(
      url := 'https://api.github.com/repos/madmonkey/antsy/dispatches',
      body := '{"event_type":"content-changed"}'::jsonb,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || token,
        'Accept', 'application/vnd.github+json',
        'User-Agent', 'antsy-supabase',
        'Content-Type', 'application/json'
      )
    );
  exception when others then
    null; -- a failed notification must never block saving content
  end;
  return null;
end $$;

revoke all on function public.request_site_rebuild() from public, anon, authenticated;

drop trigger if exists content_items_rebuild on public.content_items;
create trigger content_items_rebuild after insert or update or delete on public.content_items
  for each statement execute function public.request_site_rebuild();

drop trigger if exists topics_rebuild on public.topics;
create trigger topics_rebuild after insert or update or delete on public.topics
  for each statement execute function public.request_site_rebuild();
