# Data Model: Article Tags and Search

One additive, re-runnable migration (`supabase/migrations/20260201000001_article_tags_search.sql`). Follows the project rule that feature migrations are additive and separately adoptable.

## content_items additions

| Field | Type | Rules |
|-------|------|-------|
| tags | text[] | `not null default '{}'`. Normalised and validated by trigger (below). |
| search_vector | tsvector | Maintained by trigger. Never written by clients. |

Indexes: `gin (tags)`, `gin (search_vector)`.

Existing columns, RLS policies and grants already cover the new columns (table-level grants), as with the earlier feature migration. The `search_vector` column is selectable, which is harmless. Clients never select it.

## Trigger `content_items_tags_search`

Before insert, and before update of `title`, `body`, `tags`:

1. **Normalise tags**: lower-case, trim, drop empties, de-duplicate, sort.
2. **Validate**: at most 20 tags, each 1-30 characters, none containing a comma. Violations raise an exception with a readable message, surfaced by the editor.
3. **Build vector**: `setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B') || setweight(to_tsvector('english', regexp_replace(body, 'data:image/[^)\s"'']+', '', 'g')), 'C')`.

Backfill: one `update content_items set tags = tags` to fire the trigger for existing rows.

## Functions (security invoker)

- `list_tags() returns table (tag text, article_count bigint)`: distinct tags over rows visible to the caller, ordered by count then name.
- `search_articles(q text default null, tag_filter text[] default '{}', max_rows int default 50)`: see [contracts/search-and-tags.md](contracts/search-and-tags.md).

Both revoke from `public` and grant execute to `anon, authenticated`.

## State and rules

- Tags are plain text labels with no identity of their own. A tag exists while at least one article carries it, so "unused tag disappears" (spec edge case) is automatic.
- Renaming a tag means editing each article (spec assumption).
- A tag cannot be created for an article the administrator cannot write, since writes go through the existing `content_items` policies.
