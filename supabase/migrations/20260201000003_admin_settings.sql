-- Admin-only key/value settings (for example the analytics share URL, which must not be public).

create table if not exists public.admin_settings (
  key text primary key,
  value text not null check (char_length(value) <= 500),
  updated_at timestamptz not null default now(),
  constraint admin_settings_dashboard_https check (key <> 'analytics_dashboard_url' or value ~ '^https://')
);

drop trigger if exists admin_settings_updated_at on public.admin_settings;
create trigger admin_settings_updated_at
  before update on public.admin_settings
  for each row execute function public.set_updated_at();

alter table public.admin_settings enable row level security;

drop policy if exists admin_settings_select on public.admin_settings;
drop policy if exists admin_settings_insert on public.admin_settings;
drop policy if exists admin_settings_update on public.admin_settings;
drop policy if exists admin_settings_delete on public.admin_settings;
create policy admin_settings_select on public.admin_settings for select to authenticated using (public.is_administrator());
create policy admin_settings_insert on public.admin_settings for insert to authenticated with check (public.is_administrator());
create policy admin_settings_update on public.admin_settings for update to authenticated using (public.is_administrator()) with check (public.is_administrator());
create policy admin_settings_delete on public.admin_settings for delete to authenticated using (public.is_administrator());

revoke all on public.admin_settings from anon;
grant select, insert, update, delete on public.admin_settings to authenticated;
