# Implementation Plan: Markdown CMS Website

**Branch**: `001-markdown-cms-site` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-markdown-cms-site/spec.md`

## Summary

A static Nuxt site on GitHub Pages that mirrors the architecture of the reference project (`madmonkey/astro`): public pages read active topics and Markdown articles straight from Supabase, an allow-listed administrator signs in with Supabase Auth and manages content in a Markdown editor with sanitized live preview, and Row Level Security is the real authorization boundary. New on top of the reference: a landing-page "recent articles" preview (max 3, topic filter limited to topics flagged previewable), a day/night toolbar with social icon links, admin-embedded images stored inside the article body, and a custom root domain. The site uses its own new Supabase project whose schema keeps Astro's names as a baseline (so Astro can adopt the features later with additive migrations).

## Technical Context

**Language/Version**: TypeScript 6, Node.js >= 22.19.0 (matches reference)

**Primary Dependencies**: Nuxt 4 (current 4.x; reference uses ^4.5.2) with Vue 3, `@nuxt/ui` 4 (includes color-mode and icon support), `@supabase/supabase-js` 2, `marked` + `marked-footnote`, `sanitize-html`, Tailwind CSS 4, `@iconify-json/simple-icons` for GitHub/Bluesky icons. Versions pinned by `package-lock.json`; confirm latest with `npm view` at scaffold time.

**Storage**: A new, isolated Supabase project (PostgreSQL + Auth). Schema = Astro's baseline (`administrator_profiles`, `topics`, `content_items`, `is_administrator()`) plus additive feature columns and triggers ([data-model.md](data-model.md)). Embedded images live inside `content_items.body`. Browser localStorage only for theme choice and sign-in throttle.

**Testing**: Vitest (unit + component, jsdom), Playwright (e2e against local Supabase), `supabase test db` (pgTAP) for RLS, a build-output integration test (no secrets, correct base path, `lang`, per-page titles).

**Target Platform**: Static files on GitHub Pages (own repository), custom root domain; current evergreen desktop/mobile browsers.

**Project Type**: Web application (statically pre-rendered frontend that refreshes from the database in the browser, BaaS backend); no server code.

**Performance Goals**: Public pages show content in < 2 s (p95, typical mobile); topic filter updates < 1 s; adding an embedded image < 30 s.

**Constraints**: No secrets in repo/build (publishable key only); reads of lists never fetch article bodies; per-image <= 1 MB, per-article images <= 5 MB; GitHub Pages cannot set HTTP headers, so protections are in markup sanitization and RLS; baseline objects copied from Astro are never edited, and every feature migration is additive and separately adoptable by Astro.

**Scale/Scope**: Blog/portfolio scale; ~8 public/admin routes, 2 tables, ~15 components.

## Constitution Check

*GATE: passes before research; re-checked after design (still passes).*

| Principle | Assessment |
|-----------|------------|
| I. Small, purposeful changes | Pass. Every dependency is already proven in the reference. Skipped: search, comments, SSR, storage buckets, image sharing, i18n runtime. |
| II. Correctness is verified | Pass. Unit tests for sanitizer, image validation, throttle, preview query; pgTAP for RLS; e2e for key journeys; each task runs the smallest relevant check. |
| III. Explicit contracts and failures | Pass. [contracts/](contracts/) defines the data and UI contracts; every error state is surfaced (no silent fallback). |
| IV. Secure defaults | Pass. RLS-enforced visibility and admin writes, sanitize-html with strict image allow-list and byte-sniffing, publishable key only, safe external links. |
| V. Maintainable, observable delivery | Pass. User-visible error/loading states, non-sensitive `console.error` context, deployment/domain/DB docs in [quickstart.md](quickstart.md). |
| VI. Ponytail (required skill) | Pass. Reuse reference patterns and Astro's baseline schema; smallest data model; no speculative layers. Deferred items are named in research. |

No violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-markdown-cms-site/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── data-access.md
│   └── ui-routes.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
app/
├── app.vue
├── app.config.ts            # site name, social links
├── assets/css/main.css
├── components/              # SiteHeader, ThemeToggle, SocialLinks, RecentArticles, ArticleBody, MarkdownEditor, ...
├── composables/             # useSupabase, useAdminSession, useArticles, useTopics
├── layouts/                 # default, admin
├── pages/
│   ├── index.vue
│   ├── topics/[slug].vue
│   ├── articles/[slug].vue
│   ├── admin/index.vue, login.vue, topics.vue, articles/[id].vue
│   └── [...slug].vue        # not-found
├── types/
└── utils/                   # markdown.ts (render+sanitize), embed-image.ts, throttle.ts, excerpt.ts
supabase/
├── migrations/              # *_astro_baseline_000{1,2,3} (verbatim), *_feature_* (additive), *_optional_* (behavior-changing)
├── adoption/                # README + rollback.sql for applying the feature set to Astro's database
├── tests/                   # pgTAP policy tests + adoption test; fixtures/astro_sample_data.sql = Astro-style rows
├── seed.sql                 # local only
└── README.md
public/
└── CNAME                    # added only once the domain is chosen
tests/
├── unit/  component/  e2e/  integration/
nuxt.config.ts  package.json  .env.example
.github/workflows/deploy-pages.yml   # push, workflow_dispatch, daily schedule; runs the route script, then generate
scripts/size-spike.mjs               # one-off: saves 1, 5 and 7 MB test articles to the hosted project, then deletes them
scripts/prerender-routes.mjs         # runs before generate: reads active topic/article slugs with the publishable key, writes the route list; fails build on error or empty result
```

**Structure Decision**: Single Nuxt project at the repository root (this repo), mirroring the reference's layout so maintainers and the later Astro adoption guide map one-to-one. No backend directory: Supabase is the backend.

## Complexity Tracking

None.
