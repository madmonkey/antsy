# Data Model: Article Comments

One additive, re-runnable migration (`supabase/migrations/20260201000002_article_comments.sql`).

## content_items addition

| Field | Type | Rules |
|-------|------|-------|
| comments_enabled | boolean | `not null default true`. Existing and new articles accept comments until switched off. |

## commenter_profiles

| Field | Type | Rules |
|-------|------|-------|
| user_id | uuid | Primary key, references `auth.users` `on delete cascade`. |
| display_name | text | `not null`, trimmed, 2-40 characters. |
| is_blocked | boolean | `not null default false`. Changed only by administrators. |
| created_at, updated_at | timestamptz | Maintained by the shared `set_updated_at()` trigger. |

RLS policies:

- Select: the user's own row, or `is_administrator()`.
- Insert: `user_id = auth.uid()`, `is_verified_reader()` (confirmed email), `is_blocked = false`. `is_verified_reader()` is a `security definer` function returning true when `auth.users.email_confirmed_at is not null` for `auth.uid()`; it covers Google, GitHub and confirmed site-only accounts and refuses anonymous sessions.
- Update: the user may change only `display_name` of their own row (trigger rejects `is_blocked` changes by non-administrators); administrators may update any row.
- No delete from clients (cascades with the auth user).

## comments

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key, `gen_random_uuid()`. |
| content_item_id | uuid | Not null, references `content_items` `on delete cascade` (FR-016). Indexed with `status, created_at`. |
| user_id | uuid | Not null, references `auth.users` `on delete cascade`. |
| author_name | text | Not null. Set by trigger from the profile at insert. |
| body | text | Not null, trimmed, 1-2000 characters. |
| status | text | `not null default 'pending'`, check in (`pending`, `approved`, `rejected`). |
| created_at, updated_at | timestamptz | Shared trigger. |

### State transitions

```text
(new) -> pending -> approved
                 -> rejected
approved -> rejected   (administrator, e.g. after a complaint)
rejected -> approved   (administrator, if reconsidered)
any -> deleted         (author, or administrator)
```

Non-administrators cannot change `status`, `body`, `user_id`, or `content_item_id` after insert (trigger).

### RLS policies

| Action | Who | Condition |
|--------|-----|-----------|
| select | everyone | `status = 'approved'` and the article is readable (existing `content_items` policy applies through an `exists` check) |
| select | author | own rows, any status |
| select | administrator | all |
| insert | authenticated | `user_id = auth.uid()`, `status = 'pending'`, `is_verified_reader()`, caller has a profile with `is_blocked = false`, and the article exists, is readable and `comments_enabled` |
| update | administrator | any row (status moderation) |
| delete | author | own rows |
| delete | administrator | any row |

### Triggers

- Before insert: set `author_name` from the profile, enforce the rate limit (5 per 10 minutes, 20 pending), trim the body.
- Before update (non-administrator): reject changes to protected columns.
- Shared `set_updated_at()` for `updated_at`.

## Indexes

`comments (content_item_id, status, created_at)` for the article list and count; `comments (status, created_at) where status = 'pending'` for the admin queue.

## Non-goals

No parent id (threads), no edit history, no vote or report tables, no email storage outside `auth.users`.
