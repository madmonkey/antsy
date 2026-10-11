# Data Model: Markdown CMS Website

Own Supabase project, schema `public`. Table and column names are **Astro's** (baseline) plus additive feature columns, so the Astro database can adopt the features later (see [research.md](research.md) D3). "Article" in the spec is the `content_items` table.

## Baseline (verbatim from Astro `0001`-`0003`; never edited here)

- `administrator_profiles (user_id uuid pk -> auth.users on delete cascade, created_at, updated_at)`
- `topics (id, name, slug, is_active, created_at, updated_at)`: name not blank and trimmed, unique case-insensitively (`topics_name_lower_key`); slug unique, `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
- `content_items (id, topic_id, title, slug, body, is_active, created_at, updated_at)`: `topic_id` FK -> topics `on delete cascade` (0003); title not blank and trimmed; slug unique, same pattern; body not blank.
- `set_updated_at()` trigger function (also makes `created_at` immutable), `is_administrator()` (security definer), RLS policies and grants from `0002`/`0003`.

## Feature additions (additive; the adoption set)

### topics

| Field | Type | Rules |
|-------|------|-------|
| description | text | `not null default ''` |
| is_previewable | boolean | `not null default false`; affects only landing preview and filter |
| published_at | timestamptz | null until first activation; set once by trigger (insert and update); never cleared; used only to lock the slug |

### content_items

| Field | Type | Rules |
|-------|------|-------|
| excerpt | text | `not null default ''`, `char_length <= 280`; generated client-side |
| published_at | timestamptz | null until first activation; set once by a trigger that runs on both insert and update (so an article created already active is stamped); never cleared. Preview queries also require `published_at is not null` so an unstamped row can never sort to the top |

Backfill (in the same migration): `published_at = created_at` for rows already active.

### Optional behavior-changing rules (separate migrations)

| Rule | Where | Effect |
|------|-------|--------|
| Slug lock | `topics`, `content_items` | Trigger rejects slug changes once `published_at` is set: "published addresses are permanent" (FR-025) |
| Body cap | `content_items.body` | `char_length(body) <= 7,000,000` (Markdown incl. embedded `data:image/...` URIs); final value set by the size spike (research D6) |

Indexes: `content_items (topic_id)`, `content_items (published_at desc) where is_active`.

## Relationships and state

- Topic 1 -- N Article. Deleting a topic deletes its articles (admin only, UI confirmation).
- Article states: `inactive` (draft/hidden) <-> `active`. First activation stamps `published_at`.
- Public visibility: article visible iff `is_active` and its topic `is_active` (Astro's baseline policy).
- Landing preview eligibility: visible and topic `is_previewable`.

## Row Level Security (inherited baseline; no changes)

| Role | topics | content_items |
|------|--------|---------------|
| anon, authenticated | select where `is_active` | select where `is_active` and topic active |
| administrator (`is_administrator()`) | select all, insert, update, delete | select all, insert, update, delete |
| everyone else | no write access | no write access |

All table privileges revoked from `anon`/`authenticated` first, then granted narrowly. Table-level grants cover the new columns automatically. No service-role usage anywhere.

## Administrators

`administrator_profiles` in this project is populated by hand: create the Auth user, then insert their `user_id` once via the SQL editor. Accounts are separate from Astro's project.

## Astro compatibility (FR-026)

- Baseline objects are copies and are never altered by feature migrations; feature migrations only add columns, indexes, triggers and constraints.
- Adopting in Astro = apply the required feature migrations (columns, `published_at` trigger) and optionally the slug lock and body cap; rollback removes only those additions.
- Astro's app code reads existing columns only, so added columns do not change its queries unless it selects `*` into strictly typed shapes (Astro's own tests are not run here; whoever adopts the features should run them).

## Client-side (not persisted server-side)

- **Appearance Preference**: `color-mode` value in localStorage.
- **Sign-in throttle**: failure count and lockout expiry in localStorage.
- **Site Configuration**: `app.config.ts` (site name, social links) and public runtime config (Supabase URL, publishable key).
- **Editor draft**: in-memory body with `embedded:<n>` tokens plus image map; expanded to data URIs on save.
