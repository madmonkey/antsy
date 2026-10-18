# Implementation Plan: Article Tags and Search

**Branch**: `003-tags-and-search` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-tags-and-search/spec.md`

## Summary

Add a `tags` array to each article, tag chips on article pages and cards, a tag-aware editor field, and a client-side search page backed by one Postgres full-text-search function. Everything stays inside the existing Supabase project and static Nuxt site: one additive migration, two RPC functions, one new page, one new component, and edits to the header, card components and article editor. No new dependency and no new service.

## Technical Context

**Language/Version**: TypeScript 6, Node >= 22.19.0, PostgreSQL (Supabase), as in [feature 001](../001-markdown-cms-site/plan.md).

**Primary Dependencies**: Existing only (Nuxt 4, `@nuxt/ui` 4, `@supabase/supabase-js`). No new package.

**Storage**: `content_items.tags text[]` and `content_items.search_vector tsvector`, maintained by one trigger, with GIN indexes. No tag table. See [data-model.md](data-model.md).

**Testing**: Vitest unit and component tests only (no local Supabase, per the project testing policy). SQL is verified live on the hosted project through the quickstart. A pgTAP file is written for later, not run now.

**Target Platform**: Static GitHub Pages site. The search page is prerendered as a shell and fetches results in the browser.

**Project Type**: Web application (static frontend + BaaS).

**Performance Goals**: Search results < 1 s for 1,000 articles (SC-002), via the GIN-indexed vector.

**Constraints**: No secrets. Search runs as the caller (security invoker), so row-level security alone hides inactive articles and topics. Search input is passed as a bound parameter, never concatenated.

**Scale/Scope**: Blog scale. ~1 new page, 1 new component, 2 RPCs, 1 migration, ~6 edited files.

## Constitution Check

*GATE: passes before research; re-checked after design (still passes).*

| Principle | Assessment |
|-----------|------------|
| I. Small, purposeful changes | Pass. `text[]` column instead of two tables; Postgres built-in search instead of a search service or client index; no new dependency. |
| II. Correctness is verified | Pass. Unit tests for tag normalisation and query-string parsing; component test for chips; live SQL checks in the quickstart. |
| III. Explicit contracts and failures | Pass. [contracts/](contracts/) fixes RPC inputs, outputs and the URL format. Failures show an unavailable message, not an empty result. |
| IV. Secure defaults | Pass. Security-invoker functions rely on existing RLS; `websearch_to_tsquery` takes plain text safely; tags rendered as text. |
| V. Maintainable, observable delivery | Pass. Additive, re-runnable migration with rollback notes in the quickstart. |
| VI. Ponytail | Pass. Skipped extras are named in research (typo tolerance, tag admin screen, highlights). |

No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-tags-and-search/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── search-and-tags.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260201000001_article_tags_search.sql   # columns, trigger, indexes, RPCs

app/
├── components/
│   ├── TagChips.vue            # new: chips linking to /search?tag=
│   ├── SearchBox.vue           # new: header form -> /search?q=
│   ├── ArticleView.vue         # edit: show chips
│   ├── RecentArticles.vue      # edit: show chips on cards
│   └── SiteHeader.vue          # edit: add SearchBox
├── composables/
│   ├── useSearch.ts            # new: search_articles / list_tags calls
│   ├── useArticles.ts          # edit: select tags
│   └── useAdminContent.ts      # edit: read/write tags
├── pages/
│   ├── search.vue              # new
│   ├── topics/[slug].vue       # edit: chips in the list
│   └── admin/articles/[id].vue # edit: tag field
├── utils/tags.ts               # new: normaliseTag(s), parse/serialise the query
└── types/index.ts              # edit: tags on Article, ArticleSummary

tests/
├── unit/tags.test.ts
└── component/TagChips.test.ts
```

**Structure Decision**: Keep the single Nuxt app. Add the minimum of new files and extend the existing composables rather than creating a separate search layer.

## Complexity Tracking

None.
