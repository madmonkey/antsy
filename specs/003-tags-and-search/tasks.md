# Tasks: Article Tags and Search

**Input**: Design documents in `/specs/003-tags-and-search/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/search-and-tags.md](contracts/search-and-tags.md)

**Tests**: Small unit and component tests only (constitution Principle II, project testing policy: no local Supabase, no Playwright). SQL is verified live via [quickstart.md](quickstart.md).

**Ponytail**: Follow `.github/skills/ponytail/SKILL.md`. Mark each deliberate shortcut with `shortcut: <limit>, <when to upgrade>`.

## Format: `- [ ] [ID] [P?] [Story] Description with file path`

- **[P]**: can run in parallel (different files, no unfinished dependency)
- **[US1]/[US2]**: user story from the spec

---

## Phase 1: Foundational (blocks both stories)

- [ ] T001 Write `supabase/migrations/20260201000001_article_tags_search.sql`, additive and re-runnable: `content_items.tags text[] not null default '{}'` and `search_vector tsvector`; trigger `content_items_tags_search` (before insert, and before update of title, body, tags) that lower-cases, trims, drops empties, de-duplicates and sorts tags, raises readable exceptions for "at most 20 tags, each 1-30 characters, none containing a comma", and builds the vector as title weight A, tags weight B, body weight C with `data:image/...` URIs stripped via `regexp_replace(body, 'data:image/[^)\s"'']+', '', 'g')`; GIN indexes on `tags` and `search_vector`; backfill `update public.content_items set tags = tags`; functions `list_tags()` and `search_articles(q text default null, tag_filter text[] default '{}', max_rows int default 50)` as `security invoker` (cap rows at 50, trim `q` to 200 characters, `websearch_to_tsquery('english', q)`, `ts_rank` then `published_at desc`, tags-only ordered by `published_at desc`, no rows when both empty, never return `body`), revoke from `public`, grant execute to `anon, authenticated`
- [ ] T002 [P] Add a pgTAP file `supabase/tests/tags-search.sql` (written for later, not run now) covering normalisation, the 20 and 30 limits, hidden inactive articles in `search_articles` and `list_tags`, and large embedded-image bodies saving
- [ ] T003 [P] Add `tags: string[]` to `Article` and `ArticleSummary` and a `SearchResult` type (`id, title, slug, excerpt, published_at, tags, topic_name, topic_slug`) in `app/types/index.ts`
- [ ] T004 [P] Create `app/utils/tags.ts`: `normaliseTag(s)` (lower-case, trim, collapse spaces, reject empty, over 30 characters, or containing a comma), `normaliseTags(list)` (de-duplicated, max 20), `parseSearchQuery(query)` and `buildSearchQuery({q, tags})` for `?q=&tag=&tag=` (q trimmed, max 200 characters)
- [ ] T005 [P] Unit tests in `tests/unit/tags.test.ts` for T004: case and space folding, duplicates, the 30 and 20 limits, comma rejection, query parse/build round trip, repeated `tag` params
- [ ] T006 **User action**: apply the migration in the Supabase SQL editor and run the first checks in quickstart (a save with a large embedded image must succeed)

**Checkpoint**: Database ready and types and helpers exist.

---

## Phase 2: User Story 1 - Tag articles and show chips (P1)

**Goal**: Administrators tag articles. Readers see chips that lead to filtered results.

**Independent Test**: Add three tags to an article. Three chips appear on the article page and its card. Selecting one opens `/search?tag=<tag>`.

- [ ] T007 [P] [US1] Create `app/components/TagChips.vue`: renders `tags` as `NuxtLink` chips to `/search?tag=<encoded tag>` using `UBadge`, wraps across lines, renders nothing for an empty list
- [ ] T008 [P] [US1] Component test `tests/component/TagChips.test.ts`: empty list renders nothing, links encode special characters, many tags render all
- [ ] T009 [US1] Include `tags` in every article list and article page select in `app/composables/useArticles.ts` (including `fetchPreviewArticles`) and map it to `string[]`
- [ ] T010 [US1] Show `TagChips` in `app/components/ArticleView.vue` under the title and meta line (shared by the public page and admin preview)
- [ ] T011 [P] [US1] Show `TagChips` on cards in `app/components/RecentArticles.vue`
- [ ] T012 [P] [US1] Show `TagChips` in the article list in `app/pages/topics/[slug].vue`
- [ ] T013 [US1] In `app/composables/useAdminContent.ts` read and save `tags` with the article (normalise with `normaliseTags` before save) and expose a `listTags()` that calls `list_tags()`; surface trigger error messages to the caller
- [ ] T014 [US1] Add a tag field to `app/pages/admin/articles/[id].vue` using `UInputMenu` in multiple mode with create-item, suggestions from `listTags()`, input normalised with `normaliseTag`, and the server error shown beside the field (fall back to `UInputTags` if `UInputMenu` does not fit)

**Checkpoint**: US1 works end to end. Chips link to `/search`, which becomes useful after US2.

---

## Phase 3: User Story 2 - Search by text, tags or both (P1)

**Goal**: A reader searches by text, tags, or both and gets a shareable results page.

**Independent Test**: With tagged articles, search by a body word, by one tag, and by both. Each returns the expected set. Reload gives the same results.

- [ ] T015 [US2] Create `app/composables/useSearch.ts` with `searchArticles({q, tags})` calling `search_articles` and `fetchTags()` calling `list_tags`, mapping rows to `SearchResult`; throw on error (no silent empty result)
- [ ] T016 [US2] Create `app/pages/search.vue`: labelled search input, selected tag chips that can be removed, the tag list (with counts) when nothing is searched, results with title, excerpt, topic and `TagChips`, loading, empty ("No results" with a clear action) and error ("Search is unavailable. Try again") states, `aria-live="polite"` results region, state kept in the URL with `buildSearchQuery`, fetch after `onNuxtReady`, `useSeoMeta({ robots: 'noindex' })`
- [ ] T017 [P] [US2] Create `app/components/SearchBox.vue`: a small form that navigates to `/search?q=<text>`, labelled for screen readers
- [ ] T018 [US2] Add `SearchBox` to `app/components/SiteHeader.vue`, fitting phone widths, and update `tests/component/SiteHeader.test.ts`
- [ ] T019 [US2] Confirm `/search` is prerendered and wins over `app/pages/[...slug].vue` (add `/search` to `scripts/prerender-routes.mjs` if the route list is explicit), and that the build output test still passes

**Checkpoint**: US1 and US2 both work.

---

## Phase 4: Polish and Cross-Cutting

- [ ] T020 Run `npx nuxt prepare`, `npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json`, `npm run lint`, `npx vitest run tests/unit tests/component`; fix findings
- [ ] T021 Update `specs/001-markdown-cms-site/spec.md` Assumptions (search and tags are now covered by feature 003) and any stale mention that search is out of scope
- [ ] T022 Commit and push, wait for the Pages deploy, then run every check in [quickstart.md](quickstart.md) on the live site; fix and re-push
- [ ] T023 Tick completed tasks in this file; close the closing note with what was skipped (typo tolerance, tag admin screen, highlights, paging)

---

## Dependencies and order

- Phase 1 first. T006 (applying the migration) blocks live checks, not coding.
- US1 and US2 can proceed in parallel after Phase 1. US1's chips link to `/search`, so the full journey needs both.
- T009 before T010-T012. T013 before T014. T015 before T016. T017 before T018.

## Parallel example

After T001: T002, T003, T004, T005 together. After Phase 1: T007, T008, T011, T012, T017 together.

## Strategy

- **MVP**: Phase 1 plus US1 (tags and chips), then US2. Both are P1, so ship together, but US1 can be deployed alone.
