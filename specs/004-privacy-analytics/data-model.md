# Data Model: Privacy-Friendly Analytics

Analytics data is held by the provider. The site stores one optional setting.

## admin_settings (new, additive)

| Field | Type | Rules |
|-------|------|-------|
| key | text | Primary key. Only `analytics_dashboard_url` is used in v1. |
| value | text | `not null`. For the dashboard URL: must start with `https://`, max 500 characters (check constraint). |
| updated_at | timestamptz | `default now()`, maintained by the shared `set_updated_at()` trigger. |

Row-level security enabled. Policies, all `using / with check (public.is_administrator())`: select, insert, update, delete. No grant to `anon`. Table grants: `select, insert, update, delete` to `authenticated` only.

Migration: `supabase/migrations/20260201000003_admin_settings.sql`, additive and re-runnable.

Rollback: `drop table public.admin_settings`. The dashboard card then shows only the provider link.

## Configuration (not stored data)

| Variable | Public? | Purpose |
|----------|---------|---------|
| `NUXT_PUBLIC_ANALYTICS_PROVIDER` | Yes | `goatcounter`, `umami`, or empty for off |
| `NUXT_PUBLIC_ANALYTICS_ID` | Yes | GoatCounter site code or Umami website id |
| `NUXT_PUBLIC_ANALYTICS_HOST` | Yes | Optional script host (Umami self-hosting) |
| `NUXT_PUBLIC_ANALYTICS_DASHBOARD` | Yes | The provider's login-protected dashboard address, used for the plain link |

All four are repository variables passed to the build, like the Supabase variables.
