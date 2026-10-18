# Research: Article Tags and Search

## D1. Tags as an array column, not tables

- **Decision**: `content_items.tags text[] not null default '{}'`, GIN indexed. A trigger lower-cases, trims, de-duplicates and validates (max 20 tags, 1-30 characters each, no commas).
- **Rationale**: Tags are only ever read with their article and filtered with `@>`. No tag attributes (colour, description) are required. A join table would add two tables, policies and joins for no requirement.
- **Alternatives**: `tags` + `content_item_tags` tables (rejected: more RLS, more queries; upgrade when tags need their own page, description or rename/merge); free text in the body (rejected: not queryable).

## D2. Search with Postgres full-text search

- **Decision**: A `search_vector tsvector` column maintained by trigger (title weight A, tags B, body C), GIN indexed. Queried with `websearch_to_tsquery('english', q)` and ranked with `ts_rank`.
- **Rationale**: Built in, free, handles stemming ("comment" matches "comments"), and plain-text-safe (never throws on odd punctuation). Meets SC-002 at the expected scale.
- **Alternatives**: Client-side index such as Fuse/Lunr (rejected: ships every article body to every visitor, and the project's rule is that list reads never fetch bodies); external search service (rejected: cost, new service); `ILIKE` (rejected: no stemming or ranking, slow).

## D3. Embedded images must not enter the search vector

- **Decision**: Strip `data:image/...` URIs from the body before building the vector.
- **Rationale**: Articles embed images as base64 inside the body (up to 5 MB). A `tsvector` is limited to about 1 MB and fails with "string is too long for tsvector", which would make saving an article with a large image fail. Stripping also keeps the vector small and the search relevant.

## D4. Functions run as the caller

- **Decision**: `search_articles` and `list_tags` are `security invoker` SQL functions.
- **Rationale**: The existing policies on `content_items` and `topics` already hide inactive rows from visitors, so results and tag counts cannot leak hidden articles (FR-008, SC-003). Administrators see all rows because their policies allow it, which is correct for the editor suggestions.
- **Alternatives**: `security definer` with manual filters (rejected: duplicates the visibility rule and invites drift).

## D5. URL shape and prerendering

- **Decision**: `/search?q=text&tag=a&tag=b`. A tag chip links to `/search?tag=a`. The page is prerendered as a shell and fetches in the browser after `onNuxtReady`.
- **Rationale**: Shareable and reloadable (FR-009). Query strings are not part of the static route, so no per-tag pages need prerendering, and tags never go stale in the snapshot.
- **Note**: The existing catch-all page `[...slug].vue` is lower priority than `search.vue`, so no routing conflict. Must be confirmed in the generated output.

## D6. Editor tag input

- **Decision**: Use Nuxt UI's `UInputMenu` in multiple mode with create-item, fed by `list_tags()`.
- **Rationale**: Already installed, accessible, and gives suggestions plus new values with no custom component. If it does not fit, `UInputTags` is the fallback.

## D7. Limits chosen for the open spec items

- Tag length: 30 characters. Tags per article: 20. Search results returned: 50 (no paging in v1). Query length: 200 characters.

## D8. Deliberately skipped

Typo tolerance, synonyms, match highlighting, tag rename/merge screen, per-tag landing pages, result paging, searching comments. Each is a named shortcut in code where relevant.
