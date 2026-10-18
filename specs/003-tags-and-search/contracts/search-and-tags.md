# Contract: Tags and Search

## Database functions

### `list_tags()`

Returns `(tag text, article_count bigint)` for tags on articles visible to the caller. No arguments. Anonymous callers see only publicly readable articles.

### `search_articles(q, tag_filter, max_rows)`

| Argument | Type | Rules |
|----------|------|-------|
| q | text, optional | Plain text, trimmed, max 200 characters. Empty or null means "tags only". |
| tag_filter | text[], optional | Normalised tags. Article must carry **all** of them (`tags @> tag_filter`). |
| max_rows | int | Default 50, capped at 50 by the function. |

Behaviour:

- Both empty: returns no rows.
- `q` present: `search_vector @@ websearch_to_tsquery('english', q)`, ordered by `ts_rank` descending, then `published_at` descending.
- Tags only: ordered by `published_at` descending.
- Runs as the caller, so inactive articles and topics are never returned.

Returns, per row: `id`, `title`, `slug`, `excerpt`, `published_at`, `tags text[]`, `topic_name`, `topic_slug`. No article body.

Errors: an invalid argument or database failure surfaces as a client error and the page shows "Search is unavailable. Try again" (no silent empty result).

## Article reads

`useArticles` selects `tags` with every article list and article page read. `ArticleSummary` and `Article` gain `tags: string[]`.

## Admin writes

`useAdminContent` includes `tags` when saving an article. Validation failures from the trigger are shown beside the tag field.

## Routes

| Route | Behaviour |
|-------|-----------|
| `/search` | Search box, selected tag chips, tag list when empty, results. Prerendered shell. |
| `/search?q=<text>&tag=<a>&tag=<b>` | Same page with the search applied. Repeated `tag` params. Shareable. |

## UI

- `TagChips` renders a list of tags as links to `/search?tag=<tag>`, wrapping across lines. Renders nothing for an empty array.
- Header `SearchBox` is a form that navigates to `/search?q=`.
- Chip colour and size follow the Nuxt UI `UBadge` used for topic counts.
- Accessibility: chips are real links with visible focus. The result region uses `aria-live="polite"`. The input has a label.
