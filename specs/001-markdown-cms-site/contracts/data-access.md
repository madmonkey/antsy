# Contract: Data Access (Supabase)

The browser talks only to Supabase (PostgREST + Auth) with the URL and publishable key. Authorization is enforced by RLS, not by these calls. Entities: see [data-model.md](../data-model.md).

## Public reads (anon allowed)

| Purpose | Operation | Columns | Filters / order |
|---------|-----------|---------|-----------------|
| Topic list | select `topics` | id, name, slug, description | RLS limits to active; order name |
| Topic page | select `topics` by slug + select `content_items` | article: id, title, slug, excerpt, published_at | by topic; order published_at desc |
| Article page | select `content_items` by slug | all incl. `body`, plus topic name/slug | single; not found -> not-found page |
| Landing preview | select `content_items` with inner join `topics` | id, title, slug, excerpt, published_at, topic(name, slug) | topic `is_previewable = true`; `published_at is not null`; optional topic slug; order published_at desc; **limit 3**; never `body` |
| Preview filter options | select `topics` | name, slug | `is_previewable = true`; order name |

## Administrator operations (require signed-in allow-listed user)

| Purpose | Operation | Notes |
|---------|-----------|-------|
| Sign in / out | Auth `signInWithPassword` / `signOut` | 3 failures -> 15-minute client lockout |
| Check access | select own row in `administrator_profiles` | UI gating only |
| Topic create/update | insert / update `topics` | fields: name, slug, description, is_active, is_previewable |
| Topic delete | delete `topics` | cascades articles; confirmation required in UI |
| Article create | insert `content_items` | body validated client-side; expanded data URIs |
| Article update | update `content_items` by `id` | last save wins |
| Article delete | delete `content_items` | |
| Admin lists | select all (incl. inactive) | list views omit `body` |

## Error contract

| Condition | Behavior |
|-----------|----------|
| Network/database error on read | Inline error with Retry; shell still renders |
| Unique/constraint violation on write | Field-level message (duplicate name/slug with a suggested free alternative, blank, too large); draft preserved |
| Slug change after publishing | Refused with "published addresses are permanent"; other edits still save |
| RLS denial / expired session | Redirect to sign-in with "session ended" message; draft preserved |

## Content rendering contract

Markdown -> HTML (`marked` + footnotes) -> `sanitize-html`. Raw HTML discarded. Links: http/https/mailto. Images: `http`/`https`, or `data:image/(png|jpeg|gif|webp);base64,...` only. Same function renders public pages and admin preview. In the admin preview, `embedded:n` tokens are rendered first and replaced with the editor's validated data URIs after sanitizing; preview updates are debounced by 300 ms.

## Embedded image contract (editor)

Accept: png, jpeg, gif, webp by magic bytes; <= 1 MB each; <= 5 MB total per article (both on raw bytes, before base64); alt text editable; reject others with a message listing allowed types and limits.
